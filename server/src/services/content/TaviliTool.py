from langchain.tools import tool
from tavily import TavilyClient
from dotenv import load_dotenv
import os
load_dotenv()   

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
tavily = TavilyClient(api_key= TAVILY_API_KEY)

@tool
def tavily_search(query: str) -> str: 
    """Search the web for a topic or extract article from a URL using Tavily."""
    if query.startswith("http://") or query.startswith("https://"):
        urls = [query]
        response = tavily.extract(urls=urls,include_raw_content=True)
        for result in response["results"]:
            return result.get("raw_content", "No content found from URL.")
    else:
        result = tavily.search(query=query, search_depth="advanced", max_results=2)
        if result.get("answer"):
            return result["answer"]
        elif result.get("results"):
            return result["results"]
        return "No content found."
    return "No content found."
