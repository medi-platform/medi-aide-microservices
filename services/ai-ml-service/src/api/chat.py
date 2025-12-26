"""
Conversational AI API
Chat support, wellness chat, and intelligent responses
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4
from enum import Enum

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from src.services.chat.engine import ConversationalEngine

router = APIRouter()

# Initialize chat engine
chat_engine = ConversationalEngine()


# =============================================================================
# ENUMS AND MODELS
# =============================================================================

class ChatContext(str, Enum):
    WELLNESS = "wellness"
    SUPPORT = "support"
    CARE_PLAN = "care_plan"
    TRAINING = "training"
    GENERAL = "general"


class ChatMessage(BaseModel):
    """Chat message"""
    role: str = Field(description="user, assistant, system")
    content: str
    timestamp: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None


class ChatRequest(BaseModel):
    """Chat request"""
    user_id: str
    message: str = Field(min_length=1, max_length=2000)
    context: ChatContext = ChatContext.GENERAL
    conversation_id: Optional[str] = None
    history: Optional[List[ChatMessage]] = None
    user_profile: Optional[Dict[str, Any]] = None
    
    model_config = {"json_schema_extra": {
        "example": {
            "user_id": "caregiver-123",
            "message": "I'm feeling stressed about my workload this week",
            "context": "wellness",
            "conversation_id": "conv-456"
        }
    }}


class ChatResponse(BaseModel):
    """Chat response"""
    response_id: str
    conversation_id: str
    message: str
    suggestions: Optional[List[str]] = None
    actions: Optional[List[Dict[str, Any]]] = None
    sentiment_detected: Optional[str] = None
    context: str
    timestamp: datetime


class WellnessChatRequest(BaseModel):
    """Wellness-specific chat request"""
    user_id: str
    message: str
    wellness_context: Optional[Dict[str, Any]] = None


class SupportChatRequest(BaseModel):
    """Support chat request"""
    user_id: str
    message: str
    ticket_id: Optional[str] = None
    category: Optional[str] = None


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """
    Send a message and get AI response
    
    Contexts:
    - **wellness**: Wellness support and burnout prevention
    - **support**: Customer/technical support
    - **care_plan**: Care plan questions and guidance
    - **training**: Training and skill development
    - **general**: General assistance
    """
    try:
        conversation_id = request.conversation_id or str(uuid4())
        response_id = str(uuid4())
        
        # Process message
        result = await chat_engine.process_message(
            user_id=request.user_id,
            message=request.message,
            context=request.context,
            conversation_id=conversation_id,
            history=request.history,
            user_profile=request.user_profile
        )
        
        return ChatResponse(
            response_id=response_id,
            conversation_id=conversation_id,
            message=result["response"],
            suggestions=result.get("suggestions"),
            actions=result.get("actions"),
            sentiment_detected=result.get("sentiment"),
            context=request.context.value,
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/wellness")
async def wellness_chat(request: WellnessChatRequest):
    """
    Wellness-focused chat endpoint
    (Legacy compatibility)
    """
    chat_request = ChatRequest(
        user_id=request.user_id,
        message=request.message,
        context=ChatContext.WELLNESS,
        user_profile=request.wellness_context
    )
    
    return await send_message(chat_request)


@router.post("/support")
async def support_chat(request: SupportChatRequest):
    """
    Support chat endpoint
    (Legacy compatibility)
    """
    chat_request = ChatRequest(
        user_id=request.user_id,
        message=request.message,
        context=ChatContext.SUPPORT,
        user_profile={
            "ticket_id": request.ticket_id,
            "category": request.category
        }
    )
    
    return await send_message(chat_request)


@router.get("/history/{conversation_id}")
async def get_conversation_history(conversation_id: str, limit: int = 50):
    """Get conversation history"""
    try:
        history = await chat_engine.get_history(conversation_id, limit)
        return {
            "conversation_id": conversation_id,
            "messages": history,
            "total": len(history)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/history/{conversation_id}")
async def clear_conversation_history(conversation_id: str):
    """Clear conversation history"""
    try:
        await chat_engine.clear_history(conversation_id)
        return {"status": "cleared", "conversation_id": conversation_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws/{user_id}")
async def chat_websocket(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for real-time chat
    """
    await websocket.accept()
    conversation_id = str(uuid4())
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_json()
            message = data.get("message", "")
            context = ChatContext(data.get("context", "general"))
            
            # Process message
            result = await chat_engine.process_message(
                user_id=user_id,
                message=message,
                context=context,
                conversation_id=conversation_id
            )
            
            # Send response
            await websocket.send_json({
                "type": "response",
                "conversation_id": conversation_id,
                "message": result["response"],
                "suggestions": result.get("suggestions"),
                "timestamp": datetime.utcnow().isoformat()
            })
            
    except WebSocketDisconnect:
        # Clean up on disconnect
        pass
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })


@router.get("/contexts")
async def get_chat_contexts():
    """Get available chat contexts"""
    return {
        "contexts": {
            "wellness": {
                "description": "Wellness support and burnout prevention",
                "features": ["emotion_detection", "coping_strategies", "resource_recommendations"]
            },
            "support": {
                "description": "Customer and technical support",
                "features": ["ticket_creation", "faq_lookup", "escalation"]
            },
            "care_plan": {
                "description": "Care plan guidance and questions",
                "features": ["care_instructions", "medication_info", "activity_suggestions"]
            },
            "training": {
                "description": "Training and skill development",
                "features": ["course_recommendations", "skill_assessment", "learning_paths"]
            },
            "general": {
                "description": "General platform assistance",
                "features": ["navigation_help", "feature_explanation", "quick_answers"]
            }
        }
    }


@router.get("/health")
async def health_check():
    """Health check for chat service"""
    return {
        "status": "healthy",
        "service": "conversational-ai",
        "contexts": [c.value for c in ChatContext],
        "version": "1.0.0"
    }

