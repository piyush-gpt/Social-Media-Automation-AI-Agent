from src.config.schema import AgentState
from tavily import TavilyClient
from dotenv import load_dotenv
import os
from langgraph.types import Command
load_dotenv()


def search_image_node(state:AgentState)-> Command:
    client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
    query = (state.post_draft or "")[:400]
    search = client.search(query=query, search_depth="basic", include_images=True)
    image_url = None

    if search and search.get("images"):
        image_url = search["images"][0]

    return Command(update={"image_url": image_url},goto="image_feedback_node")