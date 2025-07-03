from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import json
import asyncio
import uuid
from typing import Dict, Any, Optional, Literal
from pydantic import BaseModel, HttpUrl
from src.agents.graph.graph import graph
from src.config.schema import AgentState
from langgraph.types import Command
from langgraph.checkpoint.memory import MemorySaver
from src.api.routes import linkedin  # add this import

app = FastAPI(title="Social Media Agent API", version="1.0.0")
app.include_router(linkedin.router, prefix="/api")  # add this after app = FastAPI(...)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active sessions
active_sessions: Dict[str, Dict[str, Any]] = {}

class CreatePostRequest(BaseModel):
    topic: Optional[str] = None
    url: Optional[str] = None
    platform: Literal["twitter", "linkedin"]
    image_wanted: bool = False
    linkedin_access_token: Optional[str] = None  # <-- add this

class HumanResponseRequest(BaseModel):
    session_id: str
    response_type: str  # "user_edit", "feedback", "satisfied", "image_url"
    response_data: Any

async def stream_graph_execution(session_id: str, initial_state: AgentState):
    """Stream the graph execution to the frontend"""
    try:
        config = {
            "configurable": {
                "thread_id": session_id
            }
        }
        
        # Start the graph execution
        result = await graph.ainvoke(initial_state, config=config)  # type: ignore
        
        # Check if there's an interrupt (human feedback needed)
        if "__interrupt__" in result:
            interrupt_data = result["__interrupt__"][0].value
            yield f"data: {json.dumps({'type': 'interrupt', 'data': interrupt_data})}\n\n"
        else:
            # No interrupt, execution completed
            final_result = {
                "type": "completion",
                "data": {
                    "post_draft": result.get("post_draft", ""),
                    "image_url": result.get("image_url"),
                    "upload_success": result.get("upload_success", False),
                    "post_url": result.get("post_url")
                }
            }
            yield f"data: {json.dumps(final_result)}\n\n"
            
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

@app.post("/api/create-post")
async def create_post(request: CreatePostRequest):
    """Create a new post generation session"""
    session_id = str(uuid.uuid4())
    
    # Validate request
    if not request.topic and not request.url:
        raise HTTPException(status_code=400, detail="Either topic or url must be provided")
    
    if request.platform not in ["twitter", "linkedin"]:
        raise HTTPException(status_code=400, detail="Platform must be 'twitter' or 'linkedin'")
    
    # Create initial state
    try:
        initial_state = AgentState(
            topic=request.topic or "",
            url=HttpUrl(request.url) if request.url else None,
            platform=request.platform,
            image_wanted=request.image_wanted,
            linkedin_access_token=request.linkedin_access_token,  # <-- add this
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid URL format: {str(e)}")
    
    # Store session
    active_sessions[session_id] = {
        "state": initial_state,
        "config": {
            "configurable": {
                "thread_id": session_id
            }
        }
    }
    
    return {
        "session_id": session_id,
        "message": "Session created successfully"
    }

@app.get("/api/stream/{session_id}")
async def stream_execution(session_id: str):
    """Stream the graph execution for a given session"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    initial_state = session["state"]
    
    async def generate():
        async for chunk in stream_graph_execution(session_id, initial_state):
            yield chunk
    
    return StreamingResponse(
        generate(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream"
        }
    )

@app.post("/api/human-feedback")
async def handle_human_feedback(request: HumanResponseRequest):
    """Handle human feedback and resume graph execution"""
    if request.session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[request.session_id]
    config = session["config"]
    
    try:
        # Create command based on response type
        if request.response_type == "user_edit":
            command = Command(resume={"user_edit": request.response_data})
        elif request.response_type == "feedback":
            command = Command(resume={"feedback": request.response_data})
        elif request.response_type == "satisfied":
            command = Command(resume={"satisfied": request.response_data})
        elif request.response_type == "image_url":
            command = Command(resume={"image_url": request.response_data})
        else:
            raise HTTPException(status_code=400, detail="Invalid response type")
        
        # Resume graph execution with Command
        result = await graph.ainvoke(command, config=config)
        
        # Check for next interrupt or completion
        if "__interrupt__" in result:
            interrupt_data = result["__interrupt__"][0].value
            return {
                "type": "interrupt",
                "data": interrupt_data
            }
        else:
            # Execution completed
            return {
                "type": "completion",
                "data": {
                    "post_draft": result.get("post_draft", ""),
                    "image_url": result.get("image_url"),
                    "upload_success": result.get("upload_success", False),
                    "post_url": result.get("post_url")
                }
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/session/{session_id}")
async def get_session_status(session_id: str):
    """Get the current status of a session"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    return {
        "session_id": session_id,
        "state": session["state"].dict()
    }

@app.delete("/api/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a session"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    del active_sessions[session_id]
    return {"message": "Session deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 