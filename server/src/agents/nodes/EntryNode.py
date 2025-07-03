from src.config.schema import AgentState
from langchain_core.messages import SystemMessage, HumanMessage
from src.config.llmconfig import llm
from src.services.content.TaviliTool import tavily_search


async def llm_entry_node(state: AgentState) -> AgentState:
    user_input = state.url or state.topic
    state.messages.append(HumanMessage(content=f"Input: {user_input}"))
    system_msg = (
        "You're a smart social content agent.\n"
        "- If the user input is a URL, use the `tavily_search` tool with the URL to extract article content.\n"
        "- If the input is a topic, decide if web search would help before generating a post.\n"
        "- If confident, you may generate a post without tool use."
    )
    llm_with_tools=llm.bind_tools([tavily_search])
    response = llm_with_tools.invoke([
        SystemMessage(content=system_msg),
        HumanMessage(content=f"Input: {user_input}")
    ])
    state.messages.append(response)
    return state