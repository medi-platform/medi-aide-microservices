"""
Conversational AI Engine
Intelligent chat support for wellness, support, and general assistance
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
import structlog

from src.services.analysis.engine import TextAnalysisEngine

logger = structlog.get_logger(__name__)


class ConversationalEngine:
    """
    Core conversational AI engine
    
    Contexts:
    - Wellness support
    - Customer support
    - Care plan guidance
    - Training assistance
    - General help
    """
    
    def __init__(self):
        self.text_analyzer = TextAnalysisEngine()
        self.conversation_store: Dict[str, List[Dict]] = {}
        self.response_templates = self._load_templates()
    
    def _load_templates(self) -> Dict[str, List[str]]:
        """Load response templates"""
        return {
            "wellness_positive": [
                "That's wonderful to hear! Keep up the great work on your self-care.",
                "I'm glad you're feeling well! Remember to maintain these positive habits.",
            ],
            "wellness_negative": [
                "I understand you're going through a difficult time. Would you like some tips for managing stress?",
                "It sounds like you're feeling overwhelmed. Let me suggest some resources that might help.",
                "I hear you. Taking care of patients while managing your own wellbeing is challenging. Here are some strategies...",
            ],
            "support_greeting": [
                "Hello! I'm here to help. What can I assist you with today?",
                "Hi there! How can I help you?",
            ],
            "care_plan_general": [
                "I can help you with care plan questions. What specific aspect would you like to discuss?",
                "Care plans are important for quality patient care. What would you like to know?",
            ],
            "default": [
                "I understand. How can I help you further?",
                "Thank you for sharing. Is there anything specific I can assist with?",
            ]
        }
    
    async def process_message(
        self,
        user_id: str,
        message: str,
        context,
        conversation_id: str,
        history: Optional[List] = None,
        user_profile: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Process incoming message and generate response"""
        
        # Analyze sentiment
        sentiment_result = await self.text_analyzer.analyze_sentiment(message)
        sentiment = sentiment_result["sentiment"]
        
        # Store in conversation history
        if conversation_id not in self.conversation_store:
            self.conversation_store[conversation_id] = []
        
        self.conversation_store[conversation_id].append({
            "role": "user",
            "content": message,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Generate response based on context and sentiment
        response = await self._generate_response(
            message=message,
            context=context.value if hasattr(context, 'value') else str(context),
            sentiment=sentiment,
            user_profile=user_profile
        )
        
        # Store assistant response
        self.conversation_store[conversation_id].append({
            "role": "assistant",
            "content": response["response"],
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return {
            "response": response["response"],
            "suggestions": response.get("suggestions"),
            "actions": response.get("actions"),
            "sentiment": sentiment
        }
    
    async def _generate_response(
        self,
        message: str,
        context: str,
        sentiment: str,
        user_profile: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Generate appropriate response"""
        
        response_text = ""
        suggestions = []
        actions = []
        
        message_lower = message.lower()
        
        # Wellness context
        if context == "wellness":
            if sentiment == "negative":
                response_text = self.response_templates["wellness_negative"][0]
                suggestions = [
                    "Would you like to try a breathing exercise?",
                    "View stress management tips",
                    "Connect with a peer support group"
                ]
                actions = [
                    {"type": "open_module", "module": "breathing_exercise"},
                    {"type": "show_resources", "category": "stress_management"}
                ]
            else:
                response_text = self.response_templates["wellness_positive"][0]
                suggestions = ["Check in tomorrow", "View your wellness progress"]
        
        # Support context
        elif context == "support":
            if "help" in message_lower or "how" in message_lower:
                response_text = "I'd be happy to help! Could you tell me more about what you're trying to do?"
                suggestions = ["View help articles", "Contact support team"]
            else:
                response_text = self.response_templates["support_greeting"][0]
        
        # Care plan context
        elif context == "care_plan":
            response_text = self.response_templates["care_plan_general"][0]
            suggestions = [
                "View care plan templates",
                "Learn about documentation",
                "Schedule training"
            ]
        
        # Default response
        else:
            response_text = self.response_templates["default"][0]
            suggestions = ["Ask a different question", "View help resources"]
        
        return {
            "response": response_text,
            "suggestions": suggestions,
            "actions": actions
        }
    
    async def get_history(
        self,
        conversation_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get conversation history"""
        history = self.conversation_store.get(conversation_id, [])
        return history[-limit:]
    
    async def clear_history(self, conversation_id: str) -> None:
        """Clear conversation history"""
        if conversation_id in self.conversation_store:
            del self.conversation_store[conversation_id]

