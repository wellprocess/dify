# -*- coding:utf-8 -*-
import json
import logging
from datetime import datetime

import flask
from flask_login import current_user
from core.login.login import login_required
from flask_restful import Resource, reqparse, fields, marshal_with, abort, inputs
from werkzeug.exceptions import Forbidden

from constants.model_template import model_templates, demo_model_templates
from controllers.console import api
from controllers.console.app.error import AppNotFoundError, ProviderNotInitializeError
from controllers.console.setup import setup_required
from controllers.console.wraps import account_initialization_required
from core.model_providers.error import ProviderTokenNotInitError, LLMBadRequestError
from core.model_providers.model_factory import ModelFactory
from core.model_providers.model_provider_factory import ModelProviderFactory
from core.model_providers.models.entity.model_params import ModelType
from events.app_event import app_was_created, app_was_deleted
from libs.helper import TimestampField
from extensions.ext_database import db
from models.model import App, AppModelConfig, Site
from services.app_model_config_service import AppModelConfigService

model_config_fields = {
    'opening_statement': fields.String,
    'suggested_questions': fields.Raw(attribute='suggested_questions_list'),
    'suggested_questions_after_answer': fields.Raw(attribute='suggested_questions_after_answer_dict'),
    'speech_to_text': fields.Raw(attribute='speech_to_text_dict'),
    'more_like_this': fields.Raw(attribute='more_like_this_dict'),
    'sensitive_word_avoidance': fields.Raw(attribute='sensitive_word_avoidance_dict'),
    'model': fields.Raw(attribute='model_dict'),
    'user_input_form': fields.Raw(attribute='user_input_form_list'),
    'pre_prompt': fields.String,
    'agent_mode': fields.Raw(attribute='agent_mode_dict'),
}

app_detail_fields = {
    'id': fields.String,
    'name': fields.String,
    'mode': fields.String,
    'icon': fields.String,
    'icon_background': fields.String,
    'enable_site': fields.Boolean,
    'enable_api': fields.Boolean,
    'api_rpm': fields.Integer,
    'api_rph': fields.Integer,
    'is_demo': fields.Boolean,
    'model_config': fields.Nested(model_config_fields, attribute='app_model_config'),
    'created_at': TimestampField
}


def _get_app(app_id, tenant_id):
    app = db.session.query(App).filter(App.id == app_id, App.tenant_id == tenant_id).first()
    if not app:
        raise AppNotFoundError
    return app


class AppListApi(Resource):
    prompt_config_fields = {
        'prompt_template': fields.String,
    }

    model_config_partial_fields = {
        'model': fields.Raw(attribute='model_dict'),
        'pre_prompt': fields.String,
    }

    app_partial_fields = {
        'id': fields.String,
        'name': fields.String,
        'mode': fields.String,
        'icon': fields.String,
        'icon_background': fields.String,
        'enable_site': fields.Boolean,
        'enable_api': fields.Boolean,
        'is_demo': fields.Boolean,
        'model_config': fields.Nested(model_config_partial_fields, attribute='app_model_config'),
        'created_at': TimestampField
    }

    app_pagination_fields = {
        'page': fields.Integer,
        'limit': fields.Integer(attribute='per_page'),
        'total': fields.Integer,
        'has_more': fields.Boolean(attribute='has_next'),
        'data': fields.List(fields.Nested(app_partial_fields), attribute='items')
    }

    @setup_required
    @login_required
    @account_initialization_required
    @marshal_with(app_pagination_fields)
    def get(self):
        """Get app list"""
        parser = reqparse.RequestParser()
        parser.add_argument('page', type=inputs.int_range(1, 99999), required=False, default=1, location='args')
        parser.add_argument('limit', type=inputs.int_range(1, 100), required=False, default=20, location='args')
        args = parser.parse_args()

        app_models = db.paginate(
            db.select(App).where(App.tenant_id == current_user.current_tenant_id,
                                 App.is_universal == False).order_by(App.created_at.desc()),
            page=args['page'],
            per_page=args['limit'],
            error_out=False)

        return app_models

    @setup_required
    @login_required
    @account_initialization_required
    @marshal_with(app_detail_fields)
    def post(self):
        """Create app"""
        parser = reqparse.RequestParser()
        parser.add_argument('name', type=str, required=True, location='json')
        parser.add_argument('mode', type=str, choices=['completion', 'chat'], location='json')
        parser.add_argument('icon', type=str, location='json')
        parser.add_argument('icon_background', type=str, location='json')
        parser.add_argument('model_config', type=dict, location='json')
        args = parser.parse_args()

        # The role of the current user in the ta table must be admin or owner
        if current_user.current_tenant.current_role not in ['admin', 'owner']:
            raise Forbidden()

        try:
            default_model = ModelFactory.get_text_generation_model(
                tenant_id=current_user.current_tenant_id
            )
        except (ProviderTokenNotInitError, LLMBadRequestError):
            default_model = None
        except Exception as e:
            logging.exception(e)
            default_model = None

        if args['model_config'] is not None:
            # validate config
            model_config_dict = args['model_config']

            # get model provider
            model_provider = ModelProviderFactory.get_preferred_model_provider(
                current_user.current_tenant_id,
                model_config_dict["model"]["provider"]
            )

            if not model_provider:
                if not default_model:
                    raise ProviderNotInitializeError(
                        f"No Default System Reasoning Model available. Please configure "
                        f"in the Settings -> Model Provider.")
                else:
                    model_config_dict["model"]["provider"] = default_model.model_provider.provider_name
                    model_config_dict["model"]["name"] = default_model.name

            model_configuration = AppModelConfigService.validate_configuration(
                tenant_id=current_user.current_tenant_id,
                account=current_user,
                config=model_config_dict
            )

            app = App(
                enable_site=True,
                enable_api=True,
                is_demo=False,
                api_rpm=0,
                api_rph=0,
                status='normal'
            )

            app_model_config = AppModelConfig()
            app_model_config = app_model_config.from_model_config_dict(model_configuration)
        else:
            if 'mode' not in args or args['mode'] is None:
                abort(400, message="mode is required")

            model_config_template = model_templates[args['mode'] + '_default']

            app = App(**model_config_template['app'])
            app_model_config = AppModelConfig(**model_config_template['model_config'])

            # get model provider
            model_provider = ModelProviderFactory.get_preferred_model_provider(
                current_user.current_tenant_id,
                app_model_config.model_dict["provider"]
            )

            if not model_provider:
                if not default_model:
                    raise ProviderNotInitializeError(
                        f"No Default System Reasoning Model available. Please configure "
                        f"in the Settings -> Model Provider.")
                else:
                    model_dict = app_model_config.model_dict
                    model_dict['provider'] = default_model.model_provider.provider_name
                    model_dict['name'] = default_model.name
                    app_model_config.model = json.dumps(model_dict)

        app.name = args['name']
        app.mode = args['mode']
        app.icon = args['icon']
        app.icon_background = args['icon_background']
        app.tenant_id = current_user.current_tenant_id

        db.session.add(app)
        db.session.flush()

        app_model_config.app_id = app.id
        db.session.add(app_model_config)
        db.session.flush()

        app.app_model_config_id = app_model_config.id

        account = current_user

        site = Site(
            app_id=app.id,
            title=app.name,
            default_language=account.interface_language,
            customize_token_strategy='not_allow',
            code=Site.generate_code(16)
        )

        db.session.add(site)
        db.session.commit()

        app_was_created.send(app)

        return app, 201


class AppTemplateApi(Resource):
    template_fields = {
        'name': fields.String,
        'icon': fields.String,
        'icon_background': fields.String,
        'description': fields.String,
        'mode': fields.String,
        'model_config': fields.Nested(model_config_fields),
    }

    template_list_fields = {
        'data': fields.List(fields.Nested(template_fields)),
    }

    @setup_required
    @login_required
    @account_initialization_required
    @marshal_with(template_list_fields)
    def get(self):
        """Get app demo templates"""
        account = current_user
        interface_language = account.interface_language

        templates = demo_model_templates.get(interface_language)
        if not templates:
            templates = demo_model_templates.get('en-US')

        return {'data': templates}


class AppApi(Resource):
    site_fields = {
        'access_token': fields.String(attribute='code'),
        'code': fields.String,
        'title': fields.String,
        'icon': fields.String,
        'icon_background': fields.String,
        'description': fields.String,
        'default_language': fields.String,
        'customize_domain': fields.String,
        'copyright': fields.String,
        'privacy_policy': fields.String,
        'customize_token_strategy': fields.String,
        'prompt_public': fields.Boolean,
        'app_base_url': fields.String,
    }

    app_detail_fields_with_site = {
        'id': fields.String,
        'name': fields.String,
        'mode': fields.String,
        'icon': fields.String,
        'icon_background': fields.String,
        'enable_site': fields.Boolean,
        'enable_api': fields.Boolean,
        'api_rpm': fields.Integer,
        'api_rph': fields.Integer,
        'is_demo': fields.Boolean,
        'model_config': fields.Nested(model_config_fields, attribute='app_model_config'),
        'site': fields.Nested(site_fields),
        'api_base_url': fields.String,
        'created_at': TimestampField
    }

    @setup_required
    @login_required
    @account_initialization_required
    @marshal_with(app_detail_fields_with_site)
    def get(self, app_id):
        """Get app detail"""
        app_id = str(app_id)
        app = _get_app(app_id, current_user.current_tenant_id)

        return app

    @setup_required
    @login_required
    @account_initialization_required
    def delete(self, app_id):
        """Delete app"""
        app_id = str(app_id)

        if current_user.current_tenant.current_role not in ['admin', 'owner']:
            raise Forbidden()

        app = _get_app(app_id, current_user.current_tenant_id)

        db.session.delete(app)
        db.session.commit()

        # todo delete related data??
        # model_config, site, api_token, conversation, message, message_feedback, message_annotation

        app_was_deleted.send(app)

        return {'result': 'success'}, 204


class AppNameApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    @marshal_with(app_detail_fields)
    def post(self, app_id):
        app_id = str(app_id)
        app = _get_app(app_id, current_user.current_tenant_id)

        parser = reqparse.RequestParser()
        parser.add_argument('name', type=str, required=True, location='json')
        args = parser.parse_args()

        app.name = args.get('name')
        app.updated_at = datetime.utcnow()
        db.session.commit()
        return app


class AppIconApi(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    @marshal_with(app_detail_fields)
    def post(self, app_id):
        app_id = str(app_id)
        app = _get_app(app_id, current_user.current_tenant_id)

        parser = reqparse.RequestParser()
        parser.add_argument('icon', type=str, location='json')
        parser.add_argument('icon_background', type=str, location='json')
        args = parser.parse_args()

        app.icon = args.get('icon')
        app.icon_background = args.get('icon_background')
        app.updated_at = datetime.utcnow()
        db.session.commit()

        return app


class AppSiteStatus(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    @marshal_with(app_detail_fields)
    def post(self, app_id):
        parser = reqparse.RequestParser()
        parser.add_argument('enable_site', type=bool, required=True, location='json')
        args = parser.parse_args()
        app_id = str(app_id)
        app = db.session.query(App).filter(App.id == app_id, App.tenant_id == current_user.current_tenant_id).first()
        if not app:
            raise AppNotFoundError

        if args.get('enable_site') == app.enable_site:
            return app

        app.enable_site = args.get('enable_site')
        app.updated_at = datetime.utcnow()
        db.session.commit()
        return app


class AppApiStatus(Resource):
    @setup_required
    @login_required
    @account_initialization_required
    @marshal_with(app_detail_fields)
    def post(self, app_id):
        parser = reqparse.RequestParser()
        parser.add_argument('enable_api', type=bool, required=True, location='json')
        args = parser.parse_args()

        app_id = str(app_id)
        app = _get_app(app_id, current_user.current_tenant_id)

        if args.get('enable_api') == app.enable_api:
            return app

        app.enable_api = args.get('enable_api')
        app.updated_at = datetime.utcnow()
        db.session.commit()
        return app


class AppCopy(Resource):
    @staticmethod
    def create_app_copy(app):
        copy_app = App(
            name=app.name + ' copy',
            icon=app.icon,
            icon_background=app.icon_background,
            tenant_id=app.tenant_id,
            mode=app.mode,
            app_model_config_id=app.app_model_config_id,
            enable_site=app.enable_site,
            enable_api=app.enable_api,
            api_rpm=app.api_rpm,
            api_rph=app.api_rph
        )
        return copy_app

    @staticmethod
    def create_app_model_config_copy(app_config, copy_app_id):
        copy_app_model_config = app_config.copy()
        copy_app_model_config.app_id = copy_app_id

        return copy_app_model_config

    @setup_required
    @login_required
    @account_initialization_required
    @marshal_with(app_detail_fields)
    def post(self, app_id):
        app_id = str(app_id)
        app = _get_app(app_id, current_user.current_tenant_id)

        copy_app = self.create_app_copy(app)
        db.session.add(copy_app)

        app_config = db.session.query(AppModelConfig). \
            filter(AppModelConfig.app_id == app_id). \
            one_or_none()

        if app_config:
            copy_app_model_config = self.create_app_model_config_copy(app_config, copy_app.id)
            db.session.add(copy_app_model_config)
            db.session.commit()
            copy_app.app_model_config_id = copy_app_model_config.id
        db.session.commit()

        return copy_app, 201


api.add_resource(AppListApi, '/apps')
api.add_resource(AppTemplateApi, '/app-templates')
api.add_resource(AppApi, '/apps/<uuid:app_id>')
api.add_resource(AppCopy, '/apps/<uuid:app_id>/copy')
api.add_resource(AppNameApi, '/apps/<uuid:app_id>/name')
api.add_resource(AppIconApi, '/apps/<uuid:app_id>/icon')
api.add_resource(AppSiteStatus, '/apps/<uuid:app_id>/site-enable')
api.add_resource(AppApiStatus, '/apps/<uuid:app_id>/api-enable')
