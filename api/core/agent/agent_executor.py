import enum
import logging
from typing import Union, Optional

from langchain.agents import BaseSingleActionAgent, BaseMultiActionAgent
from langchain.callbacks.manager import Callbacks
from langchain.memory.chat_memory import BaseChatMemory
from langchain.tools import BaseTool
from pydantic import BaseModel, Extra

from core.agent.agent.multi_dataset_router_agent import MultiDatasetRouterAgent
from core.agent.agent.openai_function_call import AutoSummarizingOpenAIFunctionCallAgent
from core.agent.agent.openai_multi_function_call import AutoSummarizingOpenMultiAIFunctionCallAgent
from core.agent.agent.output_parser.structured_chat import StructuredChatOutputParser
from core.agent.agent.structed_multi_dataset_router_agent import StructuredMultiDatasetRouterAgent
from core.agent.agent.structured_chat import AutoSummarizingStructuredChatAgent
from langchain.agents import AgentExecutor as LCAgentExecutor

from core.model_providers.models.llm.base import BaseLLM
from core.tool.dataset_retriever_tool import DatasetRetrieverTool


class PlanningStrategy(str, enum.Enum):
    ROUTER = 'router'
    REACT_ROUTER = 'react_router'
    REACT = 'react'
    FUNCTION_CALL = 'function_call'
    MULTI_FUNCTION_CALL = 'multi_function_call'


class AgentConfiguration(BaseModel):
    strategy: PlanningStrategy
    model_instance: BaseLLM
    tools: list[BaseTool]
    summary_model_instance: BaseLLM = None
    memory: Optional[BaseChatMemory] = None
    callbacks: Callbacks = None
    max_iterations: int = 6
    max_execution_time: Optional[float] = None
    early_stopping_method: str = "generate"
    # `generate` will continue to complete the last inference after reaching the iteration limit or request time limit

    class Config:
        """Configuration for this pydantic object."""

        extra = Extra.forbid
        arbitrary_types_allowed = True


class AgentExecuteResult(BaseModel):
    strategy: PlanningStrategy
    output: Optional[str]
    configuration: AgentConfiguration


class AgentExecutor:
    def __init__(self, configuration: AgentConfiguration):
        self.configuration = configuration
        self.agent = self._init_agent()

    def _init_agent(self) -> Union[BaseSingleActionAgent | BaseMultiActionAgent]:
        if self.configuration.strategy == PlanningStrategy.REACT:
            agent = AutoSummarizingStructuredChatAgent.from_llm_and_tools(
                model_instance=self.configuration.model_instance,
                llm=self.configuration.model_instance.client,
                tools=self.configuration.tools,
                output_parser=StructuredChatOutputParser(),
                summary_llm=self.configuration.summary_model_instance.client
                if self.configuration.summary_model_instance else None,
                verbose=True
            )
        elif self.configuration.strategy == PlanningStrategy.FUNCTION_CALL:
            agent = AutoSummarizingOpenAIFunctionCallAgent.from_llm_and_tools(
                model_instance=self.configuration.model_instance,
                llm=self.configuration.model_instance.client,
                tools=self.configuration.tools,
                extra_prompt_messages=self.configuration.memory.buffer if self.configuration.memory else None,  # used for read chat histories memory
                summary_llm=self.configuration.summary_model_instance.client
                if self.configuration.summary_model_instance else None,
                verbose=True
            )
        elif self.configuration.strategy == PlanningStrategy.MULTI_FUNCTION_CALL:
            agent = AutoSummarizingOpenMultiAIFunctionCallAgent.from_llm_and_tools(
                model_instance=self.configuration.model_instance,
                llm=self.configuration.model_instance.client,
                tools=self.configuration.tools,
                extra_prompt_messages=self.configuration.memory.buffer if self.configuration.memory else None,  # used for read chat histories memory
                summary_llm=self.configuration.summary_model_instance.client
                if self.configuration.summary_model_instance else None,
                verbose=True
            )
        elif self.configuration.strategy == PlanningStrategy.ROUTER:
            self.configuration.tools = [t for t in self.configuration.tools if isinstance(t, DatasetRetrieverTool)]
            agent = MultiDatasetRouterAgent.from_llm_and_tools(
                model_instance=self.configuration.model_instance,
                llm=self.configuration.model_instance.client,
                tools=self.configuration.tools,
                extra_prompt_messages=self.configuration.memory.buffer if self.configuration.memory else None,
                verbose=True
            )
        elif self.configuration.strategy == PlanningStrategy.REACT_ROUTER:
            self.configuration.tools = [t for t in self.configuration.tools if isinstance(t, DatasetRetrieverTool)]
            agent = StructuredMultiDatasetRouterAgent.from_llm_and_tools(
                model_instance=self.configuration.model_instance,
                llm=self.configuration.model_instance.client,
                tools=self.configuration.tools,
                output_parser=StructuredChatOutputParser(),
                verbose=True
            )
        else:
            raise NotImplementedError(f"Unknown Agent Strategy: {self.configuration.strategy}")

        return agent

    def should_use_agent(self, query: str) -> bool:
        return self.agent.should_use_agent(query)

    def run(self, query: str) -> AgentExecuteResult:
        agent_executor = LCAgentExecutor.from_agent_and_tools(
            agent=self.agent,
            tools=self.configuration.tools,
            memory=self.configuration.memory,
            max_iterations=self.configuration.max_iterations,
            max_execution_time=self.configuration.max_execution_time,
            early_stopping_method=self.configuration.early_stopping_method,
            callbacks=self.configuration.callbacks
        )

        try:
            output = agent_executor.run(query)
        except Exception:
            logging.exception("agent_executor run failed")
            output = None

        return AgentExecuteResult(
            output=output,
            strategy=self.configuration.strategy,
            configuration=self.configuration
        )
