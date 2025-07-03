from turtle import st
from src.config.schema import AgentState
from langchain_core.messages import ToolMessage, AIMessage, HumanMessage
from src.config.llmconfig import llm
from langgraph.types import Command

async def generate_post_node(state: AgentState):
    # If feedback_text is present, add it as HumanMessage and get LLM response
    if getattr(state, 'feedback_text', None):
        feedback_msg = HumanMessage(content=state.feedback_text or "")
        state.messages.append(feedback_msg)
        ai_response = await llm.ainvoke(state.messages)
        state.messages.append(ai_response)
        state.feedback_text = None
        state.post_draft=str(ai_response.content)
        return Command(update=state, goto="feedback_post_node")

    content = "".join([str(msg.content) for msg in state.messages if isinstance(msg, ToolMessage)])

    if not content:
        for msg in reversed(state.messages):
            if isinstance(msg, AIMessage):
                content = msg.content
                break

    platform = state.platform
    prompt = (
        f"Use the following content to write a professional post for {platform}:"
        f"\n\n{content}"
    )
    if getattr(state, 'topic', None):
        prompt += f"\n\nWrite according to this query: {state.topic}"
    print("THIS IS THE PROMPT____________________________________________________")
    print(prompt)
    print("THIS IS THE PROMPT____________________________________________________")

    state.messages.append(HumanMessage(content=prompt))
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    state.post_draft = str(response.content)
    state.messages.append(response)
    return Command(update=state, goto="feedback_post_node")


