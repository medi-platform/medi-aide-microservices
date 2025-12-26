"""
Wellness AI API
Burnout prediction, wellness insights, and intervention recommendations
"""

from datetime import datetime, date
from typing import Any, Dict, List, Optional
from uuid import uuid4
from enum import Enum

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.services.wellness.engine import WellnessEngine
from src.config import settings

router = APIRouter()

# Initialize wellness engine
wellness_engine = WellnessEngine()


# =============================================================================
# ENUMS AND MODELS
# =============================================================================

class RiskLevel(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class WellnessCategory(str, Enum):
    STRESS = "stress"
    BURNOUT = "burnout"
    WORKLOAD = "workload"
    PHYSICAL = "physical"
    EMOTIONAL = "emotional"
    SOCIAL = "social"


class WellnessMetrics(BaseModel):
    """Wellness input metrics"""
    stress_level: Optional[float] = Field(default=None, ge=0, le=10)
    sleep_quality: Optional[float] = Field(default=None, ge=0, le=10)
    work_life_balance: Optional[float] = Field(default=None, ge=0, le=10)
    job_satisfaction: Optional[float] = Field(default=None, ge=0, le=10)
    physical_health: Optional[float] = Field(default=None, ge=0, le=10)
    emotional_health: Optional[float] = Field(default=None, ge=0, le=10)
    social_connection: Optional[float] = Field(default=None, ge=0, le=10)
    workload_manageability: Optional[float] = Field(default=None, ge=0, le=10)


class WorkloadData(BaseModel):
    """Workload-related data"""
    hours_worked_week: Optional[float] = None
    visits_completed_week: Optional[int] = None
    overtime_hours: Optional[float] = None
    consecutive_work_days: Optional[int] = None
    pending_tasks: Optional[int] = None
    missed_breaks: Optional[int] = None


class BurnoutPredictionRequest(BaseModel):
    """Burnout prediction request"""
    caregiver_id: str
    wellness_metrics: WellnessMetrics
    workload_data: Optional[WorkloadData] = None
    historical_data: Optional[List[Dict[str, Any]]] = None
    
    model_config = {"json_schema_extra": {
        "example": {
            "caregiver_id": "caregiver-123",
            "wellness_metrics": {
                "stress_level": 7.5,
                "sleep_quality": 4.0,
                "work_life_balance": 3.5,
                "job_satisfaction": 6.0
            },
            "workload_data": {
                "hours_worked_week": 52,
                "overtime_hours": 12,
                "consecutive_work_days": 8
            }
        }
    }}


class BurnoutPredictionResponse(BaseModel):
    """Burnout prediction response"""
    request_id: str
    timestamp: datetime
    caregiver_id: str
    risk_level: RiskLevel
    risk_score: float = Field(ge=0, le=1)
    contributing_factors: List[Dict[str, Any]]
    trend: str = Field(description="improving, stable, declining")
    recommendations: List[Dict[str, Any]]
    next_check_date: Optional[date] = None


class WellnessCheckInRequest(BaseModel):
    """Wellness check-in request"""
    caregiver_id: str
    check_in_type: str = Field(default="quick", description="quick, comprehensive")
    metrics: WellnessMetrics
    mood: Optional[str] = None
    notes: Optional[str] = None


class WellnessCheckInResponse(BaseModel):
    """Wellness check-in response"""
    check_in_id: str
    timestamp: datetime
    caregiver_id: str
    overall_score: float
    category_scores: Dict[str, float]
    insights: List[str]
    recommendations: List[Dict[str, Any]]
    streak_days: int


class InterventionRequest(BaseModel):
    """Intervention recommendation request"""
    caregiver_id: str
    risk_level: RiskLevel
    categories: Optional[List[WellnessCategory]] = None
    max_interventions: int = 5


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/burnout/predict", response_model=BurnoutPredictionResponse)
async def predict_burnout(request: BurnoutPredictionRequest):
    """
    Predict burnout risk for a caregiver
    
    Uses multiple signals:
    - Self-reported wellness metrics
    - Workload data
    - Historical patterns
    - Behavioral indicators
    """
    request_id = str(uuid4())
    
    try:
        result = await wellness_engine.predict_burnout(
            caregiver_id=request.caregiver_id,
            wellness_metrics=request.wellness_metrics,
            workload_data=request.workload_data,
            historical_data=request.historical_data
        )
        
        return BurnoutPredictionResponse(
            request_id=request_id,
            timestamp=datetime.utcnow(),
            caregiver_id=request.caregiver_id,
            risk_level=RiskLevel(result["risk_level"]),
            risk_score=result["risk_score"],
            contributing_factors=result["factors"],
            trend=result["trend"],
            recommendations=result["recommendations"],
            next_check_date=result.get("next_check")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/check-in", response_model=WellnessCheckInResponse)
async def wellness_check_in(request: WellnessCheckInRequest):
    """
    Process a wellness check-in
    
    Returns insights and personalized recommendations
    """
    check_in_id = str(uuid4())
    
    try:
        result = await wellness_engine.process_check_in(
            caregiver_id=request.caregiver_id,
            check_in_type=request.check_in_type,
            metrics=request.metrics,
            mood=request.mood,
            notes=request.notes
        )
        
        return WellnessCheckInResponse(
            check_in_id=check_in_id,
            timestamp=datetime.utcnow(),
            caregiver_id=request.caregiver_id,
            overall_score=result["overall_score"],
            category_scores=result["category_scores"],
            insights=result["insights"],
            recommendations=result["recommendations"],
            streak_days=result.get("streak_days", 0)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/interventions")
async def get_interventions(request: InterventionRequest):
    """
    Get personalized intervention recommendations
    """
    try:
        interventions = await wellness_engine.recommend_interventions(
            caregiver_id=request.caregiver_id,
            risk_level=request.risk_level,
            categories=request.categories,
            max_count=request.max_interventions
        )
        
        return {
            "caregiver_id": request.caregiver_id,
            "risk_level": request.risk_level.value,
            "interventions": interventions,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{caregiver_id}")
async def get_wellness_history(
    caregiver_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 30
):
    """
    Get wellness history for a caregiver
    """
    try:
        history = await wellness_engine.get_history(
            caregiver_id=caregiver_id,
            start_date=start_date,
            end_date=end_date,
            limit=limit
        )
        
        return {
            "caregiver_id": caregiver_id,
            "check_ins": history["check_ins"],
            "trends": history["trends"],
            "summary": history["summary"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/{caregiver_id}")
async def get_wellness_insights(caregiver_id: str):
    """
    Get AI-generated wellness insights for a caregiver
    """
    try:
        insights = await wellness_engine.generate_insights(caregiver_id)
        
        return {
            "caregiver_id": caregiver_id,
            "insights": insights,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tip")
async def get_wellness_tip(category: Optional[WellnessCategory] = None):
    """
    Get a wellness tip
    """
    try:
        tip = await wellness_engine.get_tip(category)
        return tip
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories")
async def get_wellness_categories():
    """Get wellness categories and their descriptions"""
    return {
        "categories": {
            "stress": {"description": "Work-related stress management", "icon": "lightning"},
            "burnout": {"description": "Burnout prevention and recovery", "icon": "flame"},
            "workload": {"description": "Workload balance and management", "icon": "briefcase"},
            "physical": {"description": "Physical health and energy", "icon": "heart"},
            "emotional": {"description": "Emotional wellbeing", "icon": "smile"},
            "social": {"description": "Social connections and support", "icon": "users"}
        },
        "risk_levels": {
            "low": {"threshold": 0.3, "color": "green"},
            "moderate": {"threshold": 0.5, "color": "yellow"},
            "high": {"threshold": 0.7, "color": "orange"},
            "critical": {"threshold": 0.85, "color": "red"}
        }
    }


@router.get("/health")
async def health_check():
    """Health check for wellness service"""
    return {
        "status": "healthy",
        "service": "wellness-ai",
        "categories": [c.value for c in WellnessCategory],
        "version": "1.0.0"
    }

