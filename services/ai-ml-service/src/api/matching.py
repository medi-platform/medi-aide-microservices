"""
Matching Engine API
Caregiver-patient matching with multiple algorithms
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field

from src.config import settings
from src.services.matching.engine import MatchingEngine
from src.services.matching.models import (
    CaregiverProfile,
    PatientProfile,
    MatchResult,
    MatchingType,
    MatchQuality,
)
from src.infrastructure.redis_client import matching_cache

router = APIRouter()

# Initialize matching engine
matching_engine = MatchingEngine()


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class MatchingRequest(BaseModel):
    """Unified matching request"""
    matching_types: List[MatchingType] = Field(
        default=[MatchingType.COMPREHENSIVE],
        description="Types of matching to perform"
    )
    patient_profile: PatientProfile
    available_caregivers: Optional[List[CaregiverProfile]] = None
    constraints: Optional[Dict[str, Any]] = None
    max_results: int = Field(default=10, ge=1, le=50)
    include_explanations: bool = Field(default=True)
    
    model_config = {"json_schema_extra": {
        "example": {
            "matching_types": ["comprehensive"],
            "patient_profile": {
                "id": "patient-123",
                "care_needs": ["mobility_assistance", "medication_management"],
                "required_skills": ["cna", "first_aid"],
                "preferred_languages": ["english", "spanish"],
                "location": {"lat": 40.7128, "lng": -74.0060}
            },
            "max_results": 10
        }
    }}


class MatchingResponse(BaseModel):
    """Matching response"""
    request_id: str
    timestamp: datetime
    matches: List[MatchResult]
    total_candidates: int
    matching_criteria_used: List[str]
    processing_time_ms: float


class CareRequestMatchRequest(BaseModel):
    """Care request matching request (legacy compatibility)"""
    care_request_id: str
    patient_id: str
    care_needs: List[str]
    required_skills: List[str]
    preferred_languages: Optional[List[str]] = None
    location: Optional[Dict[str, float]] = None
    schedule_requirements: Optional[Dict[str, Any]] = None
    urgency: str = "normal"
    max_results: int = 10


class CulturalMatchRequest(BaseModel):
    """Cultural matching request"""
    patient_preferences: Dict[str, Any]
    caregiver_profiles: List[Dict[str, Any]]
    max_results: int = 5


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/find", response_model=MatchingResponse)
async def find_matches(request: MatchingRequest):
    """
    Find matches based on unified criteria
    
    Supports multiple matching types:
    - **care_request**: Skills and availability based
    - **cultural**: Cultural and language alignment
    - **skill_based**: Deep skill matching
    - **availability**: Schedule-focused matching
    - **comprehensive**: All factors combined
    """
    import time
    start_time = time.time()
    
    request_id = str(uuid4())
    
    try:
        # Check cache first
        cache_key = f"{request.patient_profile.id}:{hash(str(request.matching_types))}"
        cached = await matching_cache.get(cache_key)
        if cached:
            cached["request_id"] = request_id
            cached["from_cache"] = True
            return cached
        
        # Get caregiver pool
        if request.available_caregivers:
            caregivers = request.available_caregivers
        else:
            # In production, fetch from database
            caregivers = await matching_engine.get_available_caregivers(
                request.patient_profile,
                request.constraints
            )
        
        # Find matches
        matches = await matching_engine.find_matches(
            request.patient_profile,
            caregivers,
            request.matching_types,
            request.constraints,
            include_explanations=request.include_explanations
        )
        
        # Limit results
        matches = matches[:request.max_results]
        
        processing_time = (time.time() - start_time) * 1000
        
        response = MatchingResponse(
            request_id=request_id,
            timestamp=datetime.utcnow(),
            matches=matches,
            total_candidates=len(caregivers),
            matching_criteria_used=[mt.value for mt in request.matching_types],
            processing_time_ms=round(processing_time, 2)
        )
        
        # Cache result
        await matching_cache.set(
            cache_key,
            response.model_dump(),
            ttl=settings.redis.prediction_ttl
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/care-request-match")
async def match_care_request(request: CareRequestMatchRequest):
    """
    Match care request to caregivers (backward compatibility)
    """
    # Convert to unified format
    patient = PatientProfile(
        id=request.patient_id,
        care_needs=request.care_needs,
        required_skills=request.required_skills,
        preferred_languages=request.preferred_languages or [],
        schedule_requirements=request.schedule_requirements,
        location=request.location,
        urgency=request.urgency
    )
    
    unified_request = MatchingRequest(
        matching_types=[MatchingType.CARE_REQUEST],
        patient_profile=patient,
        max_results=request.max_results
    )
    
    return await find_matches(unified_request)


@router.post("/cultural-match")
async def match_cultural_preferences(request: CulturalMatchRequest):
    """
    Cultural matching endpoint (backward compatibility)
    """
    # Convert to unified format
    patient = PatientProfile(
        id=request.patient_preferences.get("patient_id", "unknown"),
        care_needs=[],
        required_skills=[],
        preferred_languages=request.patient_preferences.get("languages", []),
        cultural_preferences=request.patient_preferences.get("cultural_preferences", [])
    )
    
    caregivers = [
        CaregiverProfile(
            id=cg.get("id", str(uuid4())),
            name=cg.get("name", "Unknown"),
            skills=cg.get("skills", []),
            certifications=cg.get("certifications", []),
            languages=cg.get("languages", []),
            cultural_competencies=cg.get("cultural_competencies", []),
            experience_years=cg.get("experience_years", 0),
            rating=cg.get("rating")
        )
        for cg in request.caregiver_profiles
    ]
    
    unified_request = MatchingRequest(
        matching_types=[MatchingType.CULTURAL],
        patient_profile=patient,
        available_caregivers=caregivers,
        max_results=request.max_results
    )
    
    return await find_matches(unified_request)


@router.get("/criteria")
async def get_matching_criteria():
    """
    Get available matching criteria and their weights
    """
    return {
        "matching_types": [mt.value for mt in MatchingType],
        "weight_configurations": matching_engine.get_weight_configs(),
        "quality_thresholds": {
            "excellent": 0.85,
            "good": 0.70,
            "acceptable": 0.50,
            "minimum": settings.ai.matching_min_score
        },
        "features": {
            "cultural_matching": settings.ai.enable_cultural_matching,
            "explainability": settings.ai.enable_explainability
        }
    }


@router.get("/health")
async def health_check():
    """Health check for matching service"""
    return {
        "status": "healthy",
        "service": "matching-engine",
        "matching_types": [mt.value for mt in MatchingType],
        "version": "1.0.0"
    }

