"""
Unified Recommendation Engine
Enterprise-grade recommendations for wellness, training, care plans, and more
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4
import structlog

from src.config import settings

logger = structlog.get_logger(__name__)


class RecommendationEngine:
    """
    Core recommendation engine for all recommendation types
    
    Supports:
    - Wellness recommendations
    - Training recommendations
    - Care plan recommendations
    - Visit recommendations
    - Enterprise recommendations
    - Task recommendations
    """
    
    def __init__(self):
        self.recommendation_templates = self._load_templates()
    
    def _load_templates(self) -> Dict[str, List[Dict]]:
        """Load recommendation templates"""
        return {
            "wellness": [
                {"id": "w1", "category": "stress", "title": "Take Regular Breaks", 
                 "description": "Schedule 5-minute breaks every hour to reduce stress"},
                {"id": "w2", "category": "physical", "title": "Stay Hydrated",
                 "description": "Drink at least 8 glasses of water throughout your shift"},
                {"id": "w3", "category": "emotional", "title": "Practice Mindfulness",
                 "description": "Use the app's 2-minute breathing exercise between visits"},
                {"id": "w4", "category": "social", "title": "Connect with Peers",
                 "description": "Join a support group or coffeemeet session this week"},
                {"id": "w5", "category": "burnout", "title": "Review Your Schedule",
                 "description": "Consider adjusting your availability to improve work-life balance"},
            ],
            "training": [
                {"id": "t1", "category": "certification", "title": "CPR Renewal",
                 "description": "Your CPR certification expires soon. Renew now."},
                {"id": "t2", "category": "skill", "title": "Dementia Care Training",
                 "description": "Enhance your skills with specialized dementia care training"},
                {"id": "t3", "category": "compliance", "title": "Annual Compliance Training",
                 "description": "Complete required annual compliance modules"},
            ],
            "care_plan": [
                {"id": "cp1", "category": "adl", "title": "Mobility Assistance",
                 "description": "Include daily mobility exercises in care routine"},
                {"id": "cp2", "category": "medical", "title": "Medication Management",
                 "description": "Add medication reminders and tracking to care plan"},
            ],
        }
    
    async def generate(
        self,
        recommendation_type,
        user_context,
        parameters: Dict[str, Any],
        max_results: int = 10,
        include_reasoning: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Generate recommendations based on type and context
        """
        logger.info(
            "Generating recommendations",
            type=recommendation_type.value,
            user_id=user_context.user_id
        )
        
        recommendations = []
        templates = self.recommendation_templates.get(recommendation_type.value, [])
        
        for template in templates[:max_results]:
            rec = {
                "id": str(uuid4()),
                "type": recommendation_type.value,
                "title": template["title"],
                "description": template["description"],
                "priority": 0.7 + (0.3 * (1 - templates.index(template) / len(templates))),
                "category": template.get("category"),
                "action_url": f"/app/{recommendation_type.value}/{template['id']}",
                "metadata": {
                    "template_id": template["id"],
                    "generated_at": datetime.utcnow().isoformat()
                }
            }
            
            if include_reasoning:
                rec["reasoning"] = f"Based on your {user_context.user_type} profile and current goals"
            
            recommendations.append(rec)
        
        return recommendations


async def process_recommendation_request(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """Process recommendation request from Kafka"""
    engine = RecommendationEngine()
    
    from src.api.recommendations import RecommendationType, UserContext
    
    rec_type = RecommendationType(request_data.get("recommendation_type", "wellness"))
    user_context = UserContext(**request_data.get("user_context", {"user_id": "unknown", "user_type": "caregiver"}))
    
    recommendations = await engine.generate(
        recommendation_type=rec_type,
        user_context=user_context,
        parameters=request_data.get("parameters", {}),
        max_results=request_data.get("max_results", 10)
    )
    
    return {
        "user_id": user_context.user_id,
        "recommendations": recommendations,
        "total": len(recommendations)
    }

