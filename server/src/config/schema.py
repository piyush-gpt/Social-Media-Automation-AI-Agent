from langgraph.graph import add_messages
from pydantic import BaseModel, HttpUrl, model_validator, Field
from typing import Optional, List, Literal, Annotated
from langchain_core.messages import BaseMessage

class AgentState(BaseModel):
    # === Input ===
    messages:Annotated[List[BaseMessage], add_messages] = []
    topic: str = Field(default="")
    url: Optional[HttpUrl] = Field(default=None)
    platform: Literal["twitter", "linkedin"]
    image_wanted: bool = Field(default=False)
    linkedin_access_token: Optional[str] = None

    # === Generated Output ===
    post_draft:str=Field(default="")
    image_url: Optional[str] = None
    
    feedback_text: Optional[str] = None
    upload_success: bool = False
    post_url: Optional[str] = None

    @model_validator(mode="after")
    def validate_topic_or_url(self) -> "AgentState":
        if not self.topic and not self.url:
            raise ValueError("You must provide either a topic or a URL.")
        return self
