'use client'
import type { FC } from 'react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useContext } from 'use-context-selector'
import {
  PlayIcon,
} from '@heroicons/react/24/solid'
import VarIcon from '../base/icons/var-icon'
import ConfigContext from '@/context/debug-configuration'
import type { PromptVariable } from '@/models/debug'
import { AppType } from '@/types/app'
import Select from '@/app/components/base/select'
import { DEFAULT_VALUE_MAX_LEN } from '@/config'
import Button from '@/app/components/base/button'
import { ChevronDown, ChevronRight } from '@/app/components/base/icons/src/vender/line/arrows'
import Tooltip from '@/app/components/base/tooltip-plus'

export type IPromptValuePanelProps = {
  appType: AppType
  onSend?: () => void
}

const starIcon = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.75 1C2.75 0.723858 2.52614 0.5 2.25 0.5C1.97386 0.5 1.75 0.723858 1.75 1V1.75H1C0.723858 1.75 0.5 1.97386 0.5 2.25C0.5 2.52614 0.723858 2.75 1 2.75H1.75V3.5C1.75 3.77614 1.97386 4 2.25 4C2.52614 4 2.75 3.77614 2.75 3.5V2.75H3.5C3.77614 2.75 4 2.52614 4 2.25C4 1.97386 3.77614 1.75 3.5 1.75H2.75V1Z" fill="#444CE7" />
    <path d="M2.75 8.5C2.75 8.22386 2.52614 8 2.25 8C1.97386 8 1.75 8.22386 1.75 8.5V9.25H1C0.723858 9.25 0.5 9.47386 0.5 9.75C0.5 10.0261 0.723858 10.25 1 10.25H1.75V11C1.75 11.2761 1.97386 11.5 2.25 11.5C2.52614 11.5 2.75 11.2761 2.75 11V10.25H3.5C3.77614 10.25 4 10.0261 4 9.75C4 9.47386 3.77614 9.25 3.5 9.25H2.75V8.5Z" fill="#444CE7" />
    <path d="M6.96667 1.32051C6.8924 1.12741 6.70689 1 6.5 1C6.29311 1 6.10759 1.12741 6.03333 1.32051L5.16624 3.57494C5.01604 3.96546 4.96884 4.078 4.90428 4.1688C4.8395 4.2599 4.7599 4.3395 4.6688 4.40428C4.578 4.46884 4.46546 4.51604 4.07494 4.66624L1.82051 5.53333C1.62741 5.60759 1.5 5.79311 1.5 6C1.5 6.20689 1.62741 6.39241 1.82051 6.46667L4.07494 7.33376C4.46546 7.48396 4.578 7.53116 4.6688 7.59572C4.7599 7.6605 4.8395 7.7401 4.90428 7.8312C4.96884 7.922 5.01604 8.03454 5.16624 8.42506L6.03333 10.6795C6.1076 10.8726 6.29311 11 6.5 11C6.70689 11 6.89241 10.8726 6.96667 10.6795L7.83376 8.42506C7.98396 8.03454 8.03116 7.922 8.09572 7.8312C8.1605 7.7401 8.2401 7.6605 8.3312 7.59572C8.422 7.53116 8.53454 7.48396 8.92506 7.33376L11.1795 6.46667C11.3726 6.39241 11.5 6.20689 11.5 6C11.5 5.79311 11.3726 5.60759 11.1795 5.53333L8.92506 4.66624C8.53454 4.51604 8.422 4.46884 8.3312 4.40428C8.2401 4.3395 8.1605 4.2599 8.09572 4.1688C8.03116 4.078 7.98396 3.96546 7.83376 3.57494L6.96667 1.32051Z" fill="#444CE7" />
  </svg>
)

const PromptValuePanel: FC<IPromptValuePanelProps> = ({
  appType,
  onSend,
}) => {
  const { t } = useTranslation()
  const { modelConfig, inputs, setInputs, mode } = useContext(ConfigContext)
  const [promptPreviewCollapse, setPromptPreviewCollapse] = useState(false)
  const [userInputFieldCollapse, setUserInputFieldCollapse] = useState(false)
  const promptTemplate = modelConfig.configs.prompt_template
  const promptVariables = modelConfig.configs.prompt_variables.filter(({ key, name }) => {
    return key && key?.trim() && name && name?.trim()
  })

  const promptVariableObj = (() => {
    const obj: Record<string, boolean> = {}
    promptVariables.forEach((input) => {
      obj[input.key] = true
    })
    return obj
  })()

  const canNotRun = mode === AppType.completion && !modelConfig.configs.prompt_template
  const renderRunButton = () => {
    return (
      <Button
        type="primary"
        disabled={canNotRun}
        onClick={() => onSend && onSend()}
        className="w-[80px] !h-8">
        <PlayIcon className="shrink-0 w-4 h-4 mr-1" aria-hidden="true" />
        <span className='uppercase text-[13px]'>{t('appDebug.inputs.run')}</span>
      </Button>
    )
  }
  const handleInputValueChange = (key: string, value: string) => {
    if (!(key in promptVariableObj))
      return

    const newInputs = { ...inputs }
    promptVariables.forEach((input) => {
      if (input.key === key)
        newInputs[key] = value
    })
    setInputs(newInputs)
  }

  const onClear = () => {
    const newInputs: Record<string, any> = {}
    promptVariables.forEach((item) => {
      newInputs[item.key] = ''
    })
    setInputs(newInputs)
  }

  const promptPreview = (
    <div className='py-3 rounded-t-xl bg-indigo-25'>
      <div className="px-4">
        <div className="flex items-center space-x-1 cursor-pointer" onClick={() => setPromptPreviewCollapse(!promptPreviewCollapse)}>
          {starIcon}
          <div className="text-xs font-medium text-indigo-600 uppercase">{t('appDebug.inputs.previewTitle')}</div>
          {
            promptPreviewCollapse
              ? <ChevronRight className='w-3 h-3 text-gray-700' />
              : <ChevronDown className='w-3 h-3 text-gray-700' />
          }
        </div>
        {
          !promptPreviewCollapse && (
            <div className='mt-2  leading-normal'>
              {
                (promptTemplate && promptTemplate?.trim())
                  ? (
                    <div
                      className="max-h-48 overflow-y-auto text-sm text-gray-700 break-all"
                      dangerouslySetInnerHTML={{
                        __html: format(replaceStringWithValuesWithFormat(promptTemplate.replace(/</g, '&lt;').replace(/>/g, '&gt;'), promptVariables, inputs)),
                      }}
                    >
                    </div>
                  )
                  : (
                    <div className='text-xs text-gray-500'>{t('appDebug.inputs.noPrompt')}</div>
                  )
              }
            </div>
          )
        }
      </div>
    </div>
  )

  return (
    <div className="pb-3 border border-gray-200 bg-white rounded-xl" style={{
      boxShadow: '0px 4px 8px -2px rgba(16, 24, 40, 0.1), 0px 2px 4px -2px rgba(16, 24, 40, 0.06)',
    }}>
      {promptPreview}

      <div className={'mt-3 px-4 bg-white'}>
        <div className={
          `${!userInputFieldCollapse && 'mb-2'}`
        }>
          <div className='flex items-center space-x-1 cursor-pointer' onClick={() => setUserInputFieldCollapse(!userInputFieldCollapse)}>
            <div className='flex items-center justify-center w-4 h-4'><VarIcon /></div>
            <div className='text-xs font-medium text-gray-800'>{t('appDebug.inputs.userInputField')}</div>
            {
              userInputFieldCollapse
                ? <ChevronRight className='w-3 h-3 text-gray-700' />
                : <ChevronDown className='w-3 h-3 text-gray-700' />
            }
          </div>
          {appType === AppType.completion && promptVariables.length > 0 && !userInputFieldCollapse && (
            <div className="mt-1 text-xs leading-normal text-gray-500">{t('appDebug.inputs.completionVarTip')}</div>
          )}
        </div>
        {!userInputFieldCollapse && (
          <>
            {
              promptVariables.length > 0
                ? (
                  <div className="space-y-3 ">
                    {promptVariables.map(({ key, name, type, options, max_length, required }) => (
                      <div key={key} className="flex justify-between">
                        <div className="mr-1 pt-2 shrink-0 w-[120px] text-sm text-gray-900">{name || key}</div>
                        {type === 'select' && (
                          <Select
                            className='w-full'
                            defaultValue={inputs[key] as string}
                            onSelect={(i) => { handleInputValueChange(key, i.value as string) }}
                            items={(options || []).map(i => ({ name: i, value: i }))}
                            allowSearch={false}
                            bgClassName='bg-gray-50'
                          />
                        )
                        }
                        {type === 'string' && (
                          <input
                            className="w-full px-3 text-sm leading-9 text-gray-900 border-0 rounded-lg grow h-9 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-gray-200"
                            placeholder={`${name}${!required ? `(${t('appDebug.variableTable.optional')})` : ''}`}
                            type="text"
                            value={inputs[key] ? `${inputs[key]}` : ''}
                            onChange={(e) => { handleInputValueChange(key, e.target.value) }}
                            maxLength={max_length || DEFAULT_VALUE_MAX_LEN}
                          />
                        )}
                        {type === 'paragraph' && (
                          <textarea
                            className="w-full px-3 text-sm leading-9 text-gray-900 border-0 rounded-lg grow h-[120px] bg-gray-50 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-gray-200"
                            placeholder={`${name}${!required ? `(${t('appDebug.variableTable.optional')})` : ''}`}
                            value={inputs[key] ? `${inputs[key]}` : ''}
                            onChange={(e) => { handleInputValueChange(key, e.target.value) }}
                          />
                        )}

                      </div>
                    ))}
                  </div>
                )
                : (
                  <div className='text-xs text-gray-500'>{t('appDebug.inputs.noVar')}</div>
                )
            }
          </>
        )
        }
      </div>

      {
        appType === AppType.completion && (
          <div>
            <div className="mt-5 border-b border-gray-100"></div>
            <div className="flex justify-between mt-4 px-4">
              <Button
                className='!h-8 !p-3'
                onClick={onClear}
                disabled={false}
              >
                <span className='text-[13px]'>{t('common.operation.clear')}</span>
              </Button>

              {canNotRun
                ? (<Tooltip
                  popupContent={t('appDebug.otherError.promptNoBeEmpty')}
                >
                  {renderRunButton()}
                </Tooltip>)
                : renderRunButton()}
            </div>
          </div>
        )
      }
    </div>
  )
}

export default React.memo(PromptValuePanel)

function replaceStringWithValuesWithFormat(str: string, promptVariables: PromptVariable[], inputs: Record<string, any>) {
  return str.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const name = inputs[key]
    if (name) { // has set value
      return `<div class='inline-block px-1 rounded-md text-gray-900' style='background: rgba(16, 24, 40, 0.1)'>${name}</div>`
    }

    const valueObj: PromptVariable | undefined = promptVariables.find(v => v.key === key)
    return `<div class='inline-block px-1 rounded-md text-gray-500' style='background: rgba(16, 24, 40, 0.05)'>${valueObj ? valueObj.name : match}</div>`
  })
}

export function replaceStringWithValues(str: string, promptVariables: PromptVariable[], inputs: Record<string, any>) {
  return str.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const name = inputs[key]
    if (name) { // has set value
      return name
    }

    const valueObj: PromptVariable | undefined = promptVariables.find(v => v.key === key)
    return valueObj ? `{{${valueObj.name}}}` : match
  })
}

// \n -> br
function format(str: string) {
  return str.replaceAll('\n', '<br>')
}
