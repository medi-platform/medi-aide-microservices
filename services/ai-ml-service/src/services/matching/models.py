"""
Matching Engine Models
Data models for caregiver-patient matching
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class MatchingType(str, Enum):
    """Types of matching algorithms"""
    CARE_REQUEST = "care_request"
    CULTURAL = "cultural"
    SKILL_BASED = "skill_based"
    AVAILABILITY = "availability"
    COMPREHENSIVE = "comprehensive"


class MatchQuality(str, Enum):
    """Match quality levels"""
    EXCELLENT = "excellent"
    GOOD = "good"
    ACCEPTABLE = "acceptable"
    POOR = "poor"


class CaregiverProfile(BaseModel):
    """Caregiver profile for matching"""
    id: str
    name: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    cultural_competencies: Optional[List[str]] = None
    availability: Optional[Dict[str, Any]] = None
    location: Optional[Dict[str, float]] = None
    experience_years: float = 0
    rating: Optional[float] = None
    preferences: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class PatientProfile(BaseModel):
    """Patient/care request profile for matching"""
    id: str
    name: Optional[str] = None
    care_needs: List[str] = Field(default_factory=list)
    required_skills: List[str] = Field(default_factory=list)
    preferred_languages: List[str] = Field(default_factory=list)
    cultural_preferences: Optional[List[str]] = None
    schedule_requirements: Optional[Dict[str, Any]] = None
    location: Optional[Dict[str, float]] = None
    urgency: str = "normal"
    preferences: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class MatchResult(BaseModel):
    """Individual match result"""
    caregiver_id: str
    patient_id: str
    match_score: float = Field(ge=0.0, le=1.0)
    match_quality: MatchQuality
    match_reasons: List[str]
    compatibility_breakdown: Dict[str, float]
    estimated_travel_time: Optional[int] = None
    warnings: Optional[List[str]] = None
    explanation: Optional[str] = None

