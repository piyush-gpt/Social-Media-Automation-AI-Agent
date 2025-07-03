from langgraph.graph import StateGraph
from langgraph.prebuilt import ToolNode
from langgraph.types import Command
from src.config.schema import AgentState
from src.agents.nodes.EntryNode import llm_entry_node
from src.agents.nodes.GeneratePost import generate_post_node
from src.services.content.TaviliTool import tavily_search
from src.agents.nodes.SearchImage import search_image_node
from src.agents.nodes.FeedbackPost import feedback_post_node
from src.agents.nodes.FeedbackImage import image_feedback_node
from src.agents.nodes.UploadNode import upload_node
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START

import asyncio

def route_from_llm(State:AgentState) -> str:
    last_message=State.messages[-1]
    if len(getattr(last_message, "tool_calls", [])) > 0:
        return "tools_node"
    else:
        return "generate_post_node"         


graph = StateGraph(AgentState)


graph.add_node("entry_node",llm_entry_node)
graph.add_node("tools_node",ToolNode(tools=[tavily_search]))
graph.add_node("generate_post_node",generate_post_node)
graph.add_node("search_image_node",search_image_node)
graph.add_node("feedback_post_node",feedback_post_node)
graph.add_node("image_feedback_node",image_feedback_node)
graph.add_node("upload_node",upload_node)
graph.add_edge(START, "entry_node")
graph.add_conditional_edges("entry_node",route_from_llm)
graph.add_edge("tools_node", "generate_post_node")

memory=MemorySaver()
graph=graph.compile(checkpointer=memory)
