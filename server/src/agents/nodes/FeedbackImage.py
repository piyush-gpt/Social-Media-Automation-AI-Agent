from src.config.schema import AgentState
from langgraph.types import interrupt, Command

def image_feedback_node(state:AgentState):
    value = interrupt({
        "content": state.image_url,
        "type": "image feedback"
    })

    if "image_url" in value:
        state.image_url = value["image_url"]
        return Command(update=state, goto="upload_node")
    elif "satisfied" in value:
        return Command(goto="upload_node")