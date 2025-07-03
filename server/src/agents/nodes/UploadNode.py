from src.config.schema import AgentState
from langgraph.types import Command
from langgraph.graph import END 
from src.services.social.twitter import upload_to_twitter
from src.services.social.linkedin import post_to_linkedin

def upload_node(state: AgentState):
    success = False
    post_url = None

    if state.platform == "twitter":
        success, post_url = upload_to_twitter(content=state.post_draft, image_url=state.image_url or "")
    elif state.platform == "linkedin":
        print("linkedin_access_token", state.linkedin_access_token)
        if state.linkedin_access_token:
            success, post_url = post_to_linkedin(
                access_token=state.linkedin_access_token,
                content=state.post_draft,
                image_url=state.image_url
            )

    state.upload_success = success
    state.post_url = post_url

    return Command(update=state, goto=END if success else "feedback_post_node")