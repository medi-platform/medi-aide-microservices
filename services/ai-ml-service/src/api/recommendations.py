"""
Recommendations API
Unified recommendation engine for wellness, training, care plans, and more
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4
from enum import Enum

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from src.config import settings
from src.services.recommendations.engine import RecommendationEngine
from src.infrastructure.redis_client import recommendation_cache

router = APIRouter()

# Initialize recommendation engine
recommendation_engine = RecommendationEngine()


# =============================================================================
# ENUMS AND MODELS
# =============================================================================

class RecommendationType(str, Enum):
    WELLNESS = "wellness"
    TRAINING = "training"
    CARE_PLAN = "care_plan"
    VISIT = "visit"
    ENTERPRISE = "enterprise"
    TASK = "task"


class UserContext(BaseModel):
    """Context for recommendations"""
    user_id: str
    user_type: str = Field(description="caregiver, patient, agency, admin")
    role: Optional[str] = None
    agency_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class Recommendation(BaseModel):
    """Single recommendation"""
    id: str
    type: str
    title: str
    description: str
    priority: float = Field(ge=0.0, le=1.0)
    category: Optional[str] = None
    action_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    reasoning: Optional[str] = None


class RecommendationRequest(BaseModel):
    """Unified recommendation request"""
    recommendation_type: RecommendationType
    user_context: UserContext
    parameters: Optional[Dict[str, Any]] = None
    max_results: int = Field(default=10, ge=1, le=50)
    include_reasoning: bool = True
    
    model_config = {"json_schema_extra": {
        "example": {
            "recommendation_type": "wellness",
            "user_context": {
                "user_id": "caregiver-123",
                "user_type": "caregiver"
            },
            "parameters": {
                "wellness_goals": ["stress_reduction", "work_life_balance"]
            },
            "max_results": 5
        }
    }}


class RecommendationResponse(BaseModel):
    """Recommendation response"""
    request_id: str
    timestamp: datetime
    recommendation_type: str
    recommendations: List[Recommendation]
    total_generated: int
    user_id: str


class WellnessRecommendationRequest(BaseModel):
    """Wellness-specific recommendation request"""
    user_id: str
    wellness_scores: Optional[Dict[str, float]] = None
    wellness_goals: Optional[List[str]] = None
    recent_activities: Optional[List[str]] = None
    risk_level: Optional[str] = None


class TrainingRecommendationRequest(BaseModel):
    """Training recommendation request"""
    caregiver_id: str
    current_certifications: Optional[List[str]] = None
    skill_gaps: Optional[List[str]] = None
    career_goals: Optional[List[str]] = None
    agency_requirements: Optional[List[str]] = None


class CarePlanRecommendationRequest(BaseModel):
    """Care plan recommendation request"""
    patient_id: str
    diagnosis_codes: Optional[List[str]] = None
    care_goals: Optional[List[str]] = None
    current_medications: Optional[List[str]] = None
    functional_status: Optional[Dict[str, Any]] = None


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/generate", response_model=RecommendationResponse)
async def generate_recommendations(request: RecommendationRequest):
    """
    Generate recommendations based on type and context
    
    Supported types:
    - **wellness**: Stress reduction, work-life balance, burnout prevention
    - **training**: Skill development, certifications, career growth
    - **care_plan**: Patient care activities and interventions
    - **visit**: Visit planning and optimization
    - **enterprise**: Agency-level insights and actions
    - **task**: Task prioritization and scheduling
    """
    request_id = str(uuid4())
    
    try:
        # Check cache
        cache_key = f"{request.user_context.user_id}:{request.recommendation_type.value}"
        cached = await recommendation_cache.get(cache_key)
        if cached:
            cached["request_id"] = request_id
            return cached
        
        # Generate recommendations
        recommendations = await recommendation_engine.generate(
            recommendation_type=request.recommendation_type,
            user_context=request.user_context,
            parameters=request.parameters or {},
            max_results=request.max_results,
            include_reasoning=request.include_reasoning
        )
        
        response = RecommendationResponse(
            request_id=request_id,
            timestamp=datetime.utcnow(),
            recommendation_type=request.recommendation_type.value,
            recommendations=recommendations,
            total_generated=len(recommendations),
            user_id=request.user_context.user_id
        )
        
        # Cache result
        await recommendation_cache.set(
            cache_key,
            response.model_dump(),
            ttl=settings.redis.prediction_ttl
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/wellness")
async def wellness_recommendations(request: WellnessRecommendationRequest):
    """
    Generate wellness recommendations for a caregiver
    (Legacy compatibility endpoint)
    """
    unified_request = RecommendationRequest(
        recommendation_type=RecommendationType.WELLNESS,
        user_context=UserContext(
            user_id=request.user_id,
            user_type="caregiver"
        ),
        parameters={
            "wellness_scores": request.wellness_scores,
            "wellness_goals": request.wellness_goals,
            "recent_activities": request.recent_activities,
            "risk_level": request.risk_level
        }
    )
    
    return await generate_recommendations(unified_request)


@router.post("/training")
async def training_recommendations(request: TrainingRecommendationRequest):
    """
    Generate training recommendations for a caregiver
    (Legacy compatibility endpoint)
    """
    unified_request = RecommendationRequest(
        recommendation_type=RecommendationType.TRAINING,
        user_context=UserContext(
            user_id=request.caregiver_id,
            user_type="caregiver"
        ),
        parameters={
            "current_certifications": request.current_certifications,
            "skill_gaps": request.skill_gaps,
            "career_goals": request.career_goals,
            "agency_requirements": request.agency_requirements
        }
    )
    
    return await generate_recommendations(unified_request)


@router.post("/care-plan")
async def care_plan_recommendations(request: CarePlanRecommendationRequest):
    """
    Generate care plan recommendations for a patient
    (Legacy compatibility endpoint)
    """
    unified_request = RecommendationRequest(
        recommendation_type=RecommendationType.CARE_PLAN,
        user_context=UserContext(
            user_id=request.patient_id,
            user_type="patient"
        ),
        parameters={
            "diagnosis_codes": request.diagnosis_codes,
            "care_goals": request.care_goals,
            "current_medications": request.current_medications,
            "functional_status": request.functional_status
        }
    )
    
    return await generate_recommendations(unified_request)


@router.get("/types")
async def get_recommendation_types():
    """Get available recommendation types and their descriptions"""
    return {
        "types": {
            "wellness": {
                "description": "Wellness and burnout prevention recommendations",
                "target_users": ["caregiver"],
                "parameters": ["wellness_scores", "wellness_goals", "risk_level"]
            },
            "training": {
                "description": "Training and certification recommendations",
                "target_users": ["caregiver"],
                "parameters": ["skill_gaps", "career_goals", "agency_requirements"]
            },
            "care_plan": {
                "description": "Care plan activity recommendations",
                "target_users": ["patient", "caregiver"],
                "parameters": ["diagnosis_codes", "care_goals", "functional_status"]
            },
            "visit": {
                "description": "Visit planning recommendations",
                "target_users": ["caregiver", "agency"],
                "parameters": ["visit_history", "patient_needs"]
            },
            "enterprise": {
                "description": "Agency-level strategic recommendations",
                "target_users": ["agency", "admin"],
                "parameters": ["agency_metrics", "market_data"]
            },
            "task": {
                "description": "Task prioritization recommendations",
                "target_users": ["caregiver"],
                "parameters": ["pending_tasks", "urgency_levels"]
            }
        }
    }


@router.get("/health")
async def health_check():
    """Health check for recommendation service"""
    return {
        "status": "healthy",
        "service": "recommendation-engine",
        "types": [t.value for t in RecommendationType],
        "version": "1.0.0"
    }

