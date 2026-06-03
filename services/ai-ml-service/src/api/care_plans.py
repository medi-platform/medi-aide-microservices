"""
Care Plan AI API
AI-assisted care plan generation and optimization
"""

from datetime import datetime, date
from typing import Any, Dict, List, Optional
from uuid import uuid4
from enum import Enum

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.services.care_plans.engine import CarePlanEngine

router = APIRouter()

# Initialize care plan engine
care_plan_engine = CarePlanEngine()


# =============================================================================
# ENUMS AND MODELS
# =============================================================================

class CarePlanType(str, Enum):
    HOME_CARE = "home_care"
    RESIDENTIAL = "residential"
    HOSPICE = "hospice"
    PEDIATRIC = "pediatric"
    REHABILITATION = "rehabilitation"


class ActivityCategory(str, Enum):
    ADL = "adl"  # Activities of Daily Living
    IADL = "iadl"  # Instrumental Activities
    MEDICAL = "medical"
    THERAPEUTIC = "therapeutic"
    SOCIAL = "social"
    COGNITIVE = "cognitive"


class PatientProfile(BaseModel):
    """Patient profile for care plan generation"""
    id: str
    age: Optional[int] = None
    diagnosis_codes: Optional[List[str]] = None
    conditions: Optional[List[str]] = None
    medications: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    functional_status: Optional[Dict[str, Any]] = None
    cognitive_status: Optional[str] = None
    mobility_level: Optional[str] = None
    communication_needs: Optional[List[str]] = None
    cultural_preferences: Optional[Dict[str, Any]] = None


class CareGoal(BaseModel):
    """Care goal"""
    id: str
    description: str
    category: str
    priority: int = Field(default=5, ge=1, le=10)
    target_date: Optional[date] = None
    measurable_outcome: Optional[str] = None


class CarePlanActivity(BaseModel):
    """Care plan activity"""
    id: str
    name: str
    description: str
    category: ActivityCategory
    frequency: str
    duration_minutes: int
    instructions: Optional[str] = None
    required_skills: Optional[List[str]] = None
    equipment_needed: Optional[List[str]] = None
    precautions: Optional[List[str]] = None
    related_goals: Optional[List[str]] = None


class CarePlanGenerationRequest(BaseModel):
    """Care plan generation request"""
    patient_profile: PatientProfile
    care_plan_type: CarePlanType
    goals: Optional[List[CareGoal]] = None
    constraints: Optional[Dict[str, Any]] = None
    include_rationale: bool = True
    
    model_config = {"json_schema_extra": {
        "example": {
            "patient_profile": {
                "id": "patient-123",
                "age": 78,
                "conditions": ["diabetes", "hypertension", "limited_mobility"],
                "cognitive_status": "mild_impairment",
                "mobility_level": "requires_assistance"
            },
            "care_plan_type": "home_care",
            "goals": [
                {
                    "id": "goal-1",
                    "description": "Maintain blood sugar control",
                    "category": "medical",
                    "priority": 8
                }
            ]
        }
    }}


class CarePlanGenerationResponse(BaseModel):
    """Care plan generation response"""
    request_id: str
    timestamp: datetime
    patient_id: str
    care_plan_type: str
    activities: List[CarePlanActivity]
    goals: List[CareGoal]
    estimated_hours_per_week: float
    quality_score: float
    rationale: Optional[Dict[str, str]] = None
    warnings: Optional[List[str]] = None


class CarePlanOptimizationRequest(BaseModel):
    """Care plan optimization request"""
    care_plan_id: str
    current_activities: List[CarePlanActivity]
    goals: List[CareGoal]
    feedback: Optional[Dict[str, Any]] = None
    optimization_goals: Optional[List[str]] = None


class ActivitySuggestionRequest(BaseModel):
    """Activity suggestion request"""
    patient_id: str
    condition: str
    current_activities: Optional[List[str]] = None
    max_suggestions: int = 5


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/generate", response_model=CarePlanGenerationResponse)
async def generate_care_plan(request: CarePlanGenerationRequest):
    """
    Generate an AI-assisted care plan
    
    Considers:
    - Patient conditions and functional status
    - Evidence-based care activities
    - Care goals and priorities
    - Cultural preferences
    """
    request_id = str(uuid4())
    
    try:
        result = await care_plan_engine.generate(
            patient_profile=request.patient_profile,
            care_plan_type=request.care_plan_type,
            goals=request.goals,
            constraints=request.constraints,
            include_rationale=request.include_rationale
        )
        
        return CarePlanGenerationResponse(
            request_id=request_id,
            timestamp=datetime.utcnow(),
            patient_id=request.patient_profile.id,
            care_plan_type=request.care_plan_type.value,
            activities=result["activities"],
            goals=result["goals"],
            estimated_hours_per_week=result["hours_per_week"],
            quality_score=result["quality_score"],
            rationale=result.get("rationale"),
            warnings=result.get("warnings")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize")
async def optimize_care_plan(request: CarePlanOptimizationRequest):
    """
    Optimize an existing care plan based on feedback
    """
    try:
        result = await care_plan_engine.optimize(
            care_plan_id=request.care_plan_id,
            current_activities=request.current_activities,
            goals=request.goals,
            feedback=request.feedback,
            optimization_goals=request.optimization_goals
        )
        
        return {
            "care_plan_id": request.care_plan_id,
            "optimized_activities": result["activities"],
            "changes": result["changes"],
            "improvement_score": result["improvement"],
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/suggest-activities")
async def suggest_activities(request: ActivitySuggestionRequest):
    """
    Suggest care activities for a condition
    """
    try:
        suggestions = await care_plan_engine.suggest_activities(
            patient_id=request.patient_id,
            condition=request.condition,
            current_activities=request.current_activities,
            max_count=request.max_suggestions
        )
        
        return {
            "patient_id": request.patient_id,
            "condition": request.condition,
            "suggestions": suggestions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/assess-quality")
async def assess_care_plan_quality(
    care_plan_id: str,
    activities: List[CarePlanActivity],
    goals: List[CareGoal]
):
    """
    Assess the quality of a care plan
    """
    try:
        assessment = await care_plan_engine.assess_quality(
            care_plan_id=care_plan_id,
            activities=activities,
            goals=goals
        )
        
        return {
            "care_plan_id": care_plan_id,
            "overall_score": assessment["score"],
            "category_scores": assessment["categories"],
            "strengths": assessment["strengths"],
            "improvement_areas": assessment["improvements"],
            "recommendations": assessment["recommendations"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates/{care_plan_type}")
async def get_care_plan_templates(care_plan_type: CarePlanType):
    """
    Get care plan templates for a specific type
    """
    try:
        templates = await care_plan_engine.get_templates(care_plan_type)
        return {"care_plan_type": care_plan_type.value, "templates": templates}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/activity-library")
async def get_activity_library(
    category: Optional[ActivityCategory] = None,
    search: Optional[str] = None,
    limit: int = 50
):
    """
    Get library of care activities
    """
    try:
        activities = await care_plan_engine.get_activity_library(
            category=category,
            search=search,
            limit=limit
        )
        return {"activities": activities, "total": len(activities)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check for care plan service"""
    return {
        "status": "healthy",
        "service": "care-plan-ai",
        "care_plan_types": [t.value for t in CarePlanType],
        "version": "1.0.0"
    }

