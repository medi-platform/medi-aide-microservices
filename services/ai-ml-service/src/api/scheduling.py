"""
Schedule Optimization API
Route optimization, shift scheduling, and visit planning
"""

from datetime import datetime, date, time
from typing import Any, Dict, List, Optional
from uuid import uuid4
from enum import Enum

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.services.scheduling.engine import ScheduleOptimizer
from src.config import settings

router = APIRouter()

# Initialize optimizer
schedule_optimizer = ScheduleOptimizer()


# =============================================================================
# ENUMS AND MODELS
# =============================================================================

class OptimizationType(str, Enum):
    ROUTE = "route"
    SHIFT = "shift"
    VISIT = "visit"
    COMPREHENSIVE = "comprehensive"
    CULTURAL = "cultural"


class Location(BaseModel):
    """Geographic location"""
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    address: Optional[str] = None


class TimeWindow(BaseModel):
    """Time window constraint"""
    start: time
    end: time
    preferred: bool = False


class Visit(BaseModel):
    """Visit to schedule"""
    id: str
    patient_id: str
    location: Location
    duration_minutes: int = Field(ge=15, le=480)
    priority: int = Field(default=5, ge=1, le=10)
    time_window: Optional[TimeWindow] = None
    required_skills: Optional[List[str]] = None
    notes: Optional[str] = None


class CaregiverConstraints(BaseModel):
    """Caregiver scheduling constraints"""
    id: str
    name: Optional[str] = None
    start_location: Location
    end_location: Optional[Location] = None
    working_hours: TimeWindow
    max_travel_minutes: int = Field(default=45)
    max_visits: int = Field(default=10)
    skills: Optional[List[str]] = None
    break_duration_minutes: int = Field(default=30)
    preferences: Optional[Dict[str, Any]] = None


class OptimizedVisit(BaseModel):
    """Optimized visit with scheduling info"""
    visit_id: str
    patient_id: str
    scheduled_start: time
    scheduled_end: time
    travel_time_minutes: int
    travel_distance_km: float
    sequence_number: int
    notes: Optional[str] = None


class ScheduleOptimizationRequest(BaseModel):
    """Schedule optimization request"""
    optimization_date: date
    caregiver: CaregiverConstraints
    visits: List[Visit]
    optimization_types: List[OptimizationType] = Field(default=[OptimizationType.COMPREHENSIVE])
    constraints: Optional[Dict[str, Any]] = None
    
    model_config = {"json_schema_extra": {
        "example": {
            "optimization_date": "2025-01-15",
            "caregiver": {
                "id": "caregiver-123",
                "start_location": {"lat": 40.7128, "lng": -74.0060},
                "working_hours": {"start": "08:00", "end": "17:00"},
                "max_travel_minutes": 45
            },
            "visits": [
                {
                    "id": "visit-1",
                    "patient_id": "patient-1",
                    "location": {"lat": 40.7580, "lng": -73.9855},
                    "duration_minutes": 60
                }
            ],
            "optimization_types": ["comprehensive"]
        }
    }}


class ScheduleOptimizationResponse(BaseModel):
    """Schedule optimization response"""
    request_id: str
    timestamp: datetime
    optimization_date: date
    caregiver_id: str
    optimized_visits: List[OptimizedVisit]
    total_travel_time_minutes: int
    total_travel_distance_km: float
    total_working_minutes: int
    utilization_percent: float
    savings: Dict[str, Any]
    warnings: Optional[List[str]] = None


class ShiftOptimizationRequest(BaseModel):
    """Shift optimization for multiple caregivers"""
    optimization_date: date
    caregivers: List[CaregiverConstraints]
    visits: List[Visit]
    balance_workload: bool = True
    minimize_travel: bool = True


class BulkScheduleRequest(BaseModel):
    """Bulk schedule optimization"""
    start_date: date
    end_date: date
    caregiver_ids: List[str]
    include_recurring: bool = True


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/optimize", response_model=ScheduleOptimizationResponse)
async def optimize_schedule(request: ScheduleOptimizationRequest):
    """
    Optimize schedule for a single caregiver
    
    Optimization types:
    - **route**: Minimize travel time/distance
    - **shift**: Optimize shift utilization
    - **visit**: Respect visit preferences and constraints
    - **comprehensive**: All optimizations combined
    - **cultural**: Include cultural matching preferences
    """
    request_id = str(uuid4())
    
    try:
        result = await schedule_optimizer.optimize(
            date=request.optimization_date,
            caregiver=request.caregiver,
            visits=request.visits,
            optimization_types=request.optimization_types,
            constraints=request.constraints
        )
        
        return ScheduleOptimizationResponse(
            request_id=request_id,
            timestamp=datetime.utcnow(),
            optimization_date=request.optimization_date,
            caregiver_id=request.caregiver.id,
            optimized_visits=result["optimized_visits"],
            total_travel_time_minutes=result["total_travel_time"],
            total_travel_distance_km=result["total_distance"],
            total_working_minutes=result["total_working_time"],
            utilization_percent=result["utilization"],
            savings=result["savings"],
            warnings=result.get("warnings")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize-shifts")
async def optimize_shifts(request: ShiftOptimizationRequest):
    """
    Optimize shifts for multiple caregivers
    Distributes visits among caregivers optimally
    """
    request_id = str(uuid4())
    
    try:
        result = await schedule_optimizer.optimize_multi_caregiver(
            date=request.optimization_date,
            caregivers=request.caregivers,
            visits=request.visits,
            balance_workload=request.balance_workload,
            minimize_travel=request.minimize_travel
        )
        
        return {
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat(),
            "optimization_date": request.optimization_date.isoformat(),
            "assignments": result["assignments"],
            "unassigned_visits": result.get("unassigned", []),
            "metrics": result["metrics"],
            "warnings": result.get("warnings")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/suggest-times")
async def suggest_visit_times(
    patient_id: str,
    caregiver_id: str,
    date: date,
    duration_minutes: int = 60,
    count: int = 3
):
    """
    Suggest optimal visit times for a patient-caregiver pair
    """
    try:
        suggestions = await schedule_optimizer.suggest_times(
            patient_id=patient_id,
            caregiver_id=caregiver_id,
            date=date,
            duration_minutes=duration_minutes,
            count=count
        )
        
        return {
            "patient_id": patient_id,
            "caregiver_id": caregiver_id,
            "date": date.isoformat(),
            "suggestions": suggestions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/estimate-travel")
async def estimate_travel(
    origin: Location,
    destination: Location,
    departure_time: Optional[datetime] = None
):
    """
    Estimate travel time and distance between two locations
    """
    try:
        estimate = await schedule_optimizer.estimate_travel(
            origin=origin,
            destination=destination,
            departure_time=departure_time
        )
        
        return {
            "origin": origin.model_dump(),
            "destination": destination.model_dump(),
            "travel_time_minutes": estimate["time_minutes"],
            "distance_km": estimate["distance_km"],
            "route_type": estimate.get("route_type", "driving")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/constraints")
async def get_optimization_constraints():
    """Get default optimization constraints"""
    return {
        "defaults": {
            "max_travel_minutes": settings.ai.schedule_max_travel_minutes,
            "buffer_between_visits": settings.ai.schedule_buffer_minutes,
            "max_visits_per_day": 10,
            "min_break_duration": 30
        },
        "optimization_types": [t.value for t in OptimizationType],
        "features": {
            "route_optimization": True,
            "shift_balancing": True,
            "cultural_preferences": settings.ai.enable_cultural_matching,
            "traffic_aware": True
        }
    }


@router.get("/health")
async def health_check():
    """Health check for scheduling service"""
    return {
        "status": "healthy",
        "service": "schedule-optimizer",
        "optimization_types": [t.value for t in OptimizationType],
        "version": "1.0.0"
    }

