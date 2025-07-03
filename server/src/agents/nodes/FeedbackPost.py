from turtle import st
from src.config.schema import AgentState
from langgraph.types import interrupt, Command

def feedback_post_node(state: AgentState):
    value = interrupt({
        "content": state.post_draft,
        "type": "post feedback"
    })

    if "user_edit" in value:
        state.post_draft = value["user_edit"]
        if state.image_wanted:
            return Command(update=state, goto="search_image_node")
        else:
            return Command(update=state, goto="upload_node")
    elif "feedback" in value:
        state.feedback_text = value["feedback"]
        return Command(update=state, goto="generate_post_node") 
    elif "satisfied" in value:
        if state.image_wanted:
            return Command(goto="search_image_node")
        else:
            return Command(goto="upload_node")
    