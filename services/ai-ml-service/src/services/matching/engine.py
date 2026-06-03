"""
Unified Matching Engine
Enterprise-grade caregiver-patient matching with multiple algorithms
"""

import math
from typing import Any, Dict, List, Optional
import structlog
import numpy as np

from src.config import settings
from src.services.matching.models import (
    CaregiverProfile,
    PatientProfile,
    MatchResult,
    MatchingType,
    MatchQuality,
)

logger = structlog.get_logger(__name__)


class MatchingEngine:
    """
    Core matching engine handling all types of caregiver-patient matching
    
    Supports:
    - Care request matching (skills, availability, location)
    - Cultural matching (language, cultural competencies)
    - Skill-based matching (deep skill analysis)
    - Availability matching (schedule alignment)
    - Comprehensive matching (all factors)
    """
    
    def __init__(self):
        self.weight_configs = {
            MatchingType.CARE_REQUEST: {
                "skills": 0.35,
                "availability": 0.25,
                "location": 0.20,
                "experience": 0.10,
                "rating": 0.10
            },
            MatchingType.CULTURAL: {
                "language": 0.30,
                "cultural_competency": 0.40,
                "experience": 0.20,
                "rating": 0.10
            },
            MatchingType.SKILL_BASED: {
                "skills": 0.50,
                "certifications": 0.30,
                "experience": 0.20
            },
            MatchingType.AVAILABILITY: {
                "schedule_match": 0.60,
                "location": 0.30,
                "flexibility": 0.10
            },
            MatchingType.COMPREHENSIVE: {
                "skills": 0.25,
                "cultural": 0.20,
                "availability": 0.20,
                "location": 0.15,
                "experience": 0.10,
                "rating": 0.10
            }
        }
        
        self.min_score = settings.ai.matching_min_score
        self.max_results = settings.ai.matching_max_results
    
    def get_weight_configs(self) -> Dict[str, Dict[str, float]]:
        """Get weight configurations for all matching types"""
        return {k.value: v for k, v in self.weight_configs.items()}
    
    async def get_available_caregivers(
        self,
        patient: PatientProfile,
        constraints: Optional[Dict[str, Any]] = None
    ) -> List[CaregiverProfile]:
        """
        Get available caregivers from database
        In production, this queries the caregiver database
        """
        # Placeholder - in production, query database
        logger.info("Fetching available caregivers", patient_id=patient.id)
        return []
    
    async def find_matches(
        self,
        patient: PatientProfile,
        caregivers: List[CaregiverProfile],
        matching_types: List[MatchingType],
        constraints: Optional[Dict[str, Any]] = None,
        include_explanations: bool = True
    ) -> List[MatchResult]:
        """
        Find best matches based on specified criteria
        
        Args:
            patient: Patient profile with care needs
            caregivers: List of available caregivers
            matching_types: Types of matching to perform
            constraints: Additional constraints
            include_explanations: Include human-readable explanations
            
        Returns:
            List of MatchResult sorted by score descending
        """
        matches = []
        
        for caregiver in caregivers:
            # Calculate match scores for each type
            scores = {}
            for match_type in matching_types:
                score = await self._calculate_match_score(
                    patient, caregiver, match_type, constraints
                )
                scores[match_type.value] = score
            
            # Calculate overall score
            if len(matching_types) > 1:
                overall_score = float(np.mean(list(scores.values())))
            else:
                overall_score = list(scores.values())[0]
            
            # Create match result if above threshold
            if overall_score >= self.min_score:
                match = MatchResult(
                    caregiver_id=caregiver.id,
                    patient_id=patient.id,
                    match_score=round(overall_score, 3),
                    match_quality=self._determine_match_quality(overall_score),
                    match_reasons=self._generate_match_reasons(
                        patient, caregiver, scores
                    ) if include_explanations else [],
                    compatibility_breakdown=scores,
                    estimated_travel_time=self._estimate_travel_time(
                        patient.location, caregiver.location
                    ),
                    warnings=self._check_warnings(patient, caregiver),
                    explanation=self._generate_explanation(
                        patient, caregiver, scores, overall_score
                    ) if include_explanations else None
                )
                matches.append(match)
        
        # Sort by score descending
        matches.sort(key=lambda x: x.match_score, reverse=True)
        
        logger.info(
            "Matching completed",
            patient_id=patient.id,
            total_candidates=len(caregivers),
            matches_found=len(matches)
        )
        
        return matches[:self.max_results]
    
    async def _calculate_match_score(
        self,
        patient: PatientProfile,
        caregiver: CaregiverProfile,
        match_type: MatchingType,
        constraints: Optional[Dict[str, Any]]
    ) -> float:
        """Calculate match score for specific matching type"""
        
        weights = self.weight_configs[match_type]
        scores = {}
        
        # Skills matching
        if "skills" in weights:
            skill_match = self._calculate_skill_match(
                patient.required_skills, caregiver.skills
            )
            scores["skills"] = skill_match * weights["skills"]
        
        # Availability matching
        if "availability" in weights and caregiver.availability:
            avail_match = self._calculate_availability_match(
                patient.schedule_requirements, caregiver.availability
            )
            scores["availability"] = avail_match * weights["availability"]
        elif "availability" in weights:
            scores["availability"] = 0.5 * weights["availability"]
        
        # Location matching
        if "location" in weights and patient.location and caregiver.location:
            location_match = self._calculate_location_match(
                patient.location, caregiver.location
            )
            scores["location"] = location_match * weights["location"]
        elif "location" in weights:
            scores["location"] = 0.5 * weights["location"]
        
        # Language matching
        if "language" in weights or "cultural" in weights:
            lang_match = self._calculate_language_match(
                patient.preferred_languages, caregiver.languages
            )
            weight = weights.get("language", weights.get("cultural", 0))
            scores["language"] = lang_match * weight
        
        # Cultural competency matching
        if "cultural_competency" in weights or "cultural" in weights:
            cultural_match = self._calculate_cultural_match(
                patient.cultural_preferences, caregiver.cultural_competencies
            )
            weight = weights.get("cultural_competency", weights.get("cultural", 0) * 0.5)
            scores["cultural_competency"] = cultural_match * weight
        
        # Certifications matching
        if "certifications" in weights and caregiver.certifications:
            cert_bonus = min(len(caregiver.certifications) * 0.15, 1.0)
            scores["certifications"] = cert_bonus * weights["certifications"]
        
        # Experience scoring
        if "experience" in weights:
            exp_score = min(caregiver.experience_years / 10, 1.0)
            scores["experience"] = exp_score * weights["experience"]
        
        # Rating scoring
        if "rating" in weights and caregiver.rating:
            rating_score = caregiver.rating / 5.0
            scores["rating"] = rating_score * weights["rating"]
        elif "rating" in weights:
            scores["rating"] = 0.7 * weights["rating"]  # Default neutral rating
        
        return sum(scores.values())
    
    def _calculate_skill_match(
        self, 
        required: List[str], 
        available: List[str],
        detailed: bool = False
    ) -> float:
        """Calculate skill matching score"""
        if not required:
            return 1.0
        
        required_set = set(s.lower().strip() for s in required)
        available_set = set(s.lower().strip() for s in available)
        
        matches = required_set.intersection(available_set)
        base_score = len(matches) / len(required_set)
        
        if detailed:
            # Bonus for additional relevant skills
            extra_skills = available_set - required_set
            bonus = min(len(extra_skills) * 0.05, 0.2)
            return min(base_score + bonus, 1.0)
        
        return base_score
    
    def _calculate_availability_match(
        self,
        required: Optional[Dict[str, Any]],
        available: Optional[Dict[str, Any]]
    ) -> float:
        """Calculate availability matching score"""
        if not required or not available:
            return 0.5  # Neutral if no data
        
        # In production, this would do sophisticated schedule overlap analysis
        # Simplified implementation
        return 0.8
    
    def _calculate_location_match(
        self,
        patient_loc: Dict[str, float],
        caregiver_loc: Dict[str, float]
    ) -> float:
        """Calculate location proximity score"""
        distance = self._haversine_distance(
            patient_loc.get("lat", 0),
            patient_loc.get("lng", 0),
            caregiver_loc.get("lat", 0),
            caregiver_loc.get("lng", 0)
        )
        
        # Score based on distance (miles)
        max_distance = settings.ai.schedule_max_travel_minutes / 2  # Rough miles estimate
        if distance <= 5:
            return 1.0
        elif distance <= 10:
            return 0.85
        elif distance <= 20:
            return 0.65
        elif distance <= max_distance:
            return 0.45
        else:
            return 0.2
    
    def _calculate_language_match(
        self,
        preferred: List[str],
        available: List[str]
    ) -> float:
        """Calculate language matching score"""
        if not preferred:
            return 1.0
        
        preferred_set = set(lang.lower().strip() for lang in preferred)
        available_set = set(lang.lower().strip() for lang in available)
        
        if preferred_set.intersection(available_set):
            return 1.0
        elif "english" in available_set:
            return 0.7
        else:
            return 0.3
    
    def _calculate_cultural_match(
        self,
        preferences: Optional[List[str]],
        competencies: Optional[List[str]]
    ) -> float:
        """Calculate cultural matching score"""
        if not preferences or not competencies:
            return 0.7  # Neutral if no specific preferences
        
        pref_set = set(p.lower().strip() for p in preferences)
        comp_set = set(c.lower().strip() for c in competencies)
        
        matches = pref_set.intersection(comp_set)
        if not pref_set:
            return 0.7
        
        return len(matches) / len(pref_set)
    
    def _haversine_distance(
        self, lat1: float, lon1: float, lat2: float, lon2: float
    ) -> float:
        """Calculate distance between two points in miles"""
        R = 3959  # Earth radius in miles
        
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        
        a = (math.sin(dlat/2)**2 + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
             math.sin(dlon/2)**2)
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    def _estimate_travel_time(
        self,
        patient_loc: Optional[Dict[str, float]],
        caregiver_loc: Optional[Dict[str, float]]
    ) -> Optional[int]:
        """Estimate travel time in minutes"""
        if not patient_loc or not caregiver_loc:
            return None
        
        distance = self._haversine_distance(
            patient_loc.get("lat", 0),
            patient_loc.get("lng", 0),
            caregiver_loc.get("lat", 0),
            caregiver_loc.get("lng", 0)
        )
        
        # Rough estimate: 25 mph average speed in urban areas
        return int((distance / 25) * 60)
    
    def _determine_match_quality(self, score: float) -> MatchQuality:
        """Determine match quality based on score"""
        if score >= 0.85:
            return MatchQuality.EXCELLENT
        elif score >= 0.70:
            return MatchQuality.GOOD
        elif score >= 0.50:
            return MatchQuality.ACCEPTABLE
        else:
            return MatchQuality.POOR
    
    def _generate_match_reasons(
        self,
        patient: PatientProfile,
        caregiver: CaregiverProfile,
        scores: Dict[str, float]
    ) -> List[str]:
        """Generate human-readable match reasons"""
        reasons = []
        
        # Skill matches
        if patient.required_skills and caregiver.skills:
            skill_matches = set(patient.required_skills).intersection(set(caregiver.skills))
            if skill_matches:
                reasons.append(f"Matches skills: {', '.join(list(skill_matches)[:3])}")
        
        # Language matches
        if patient.preferred_languages and caregiver.languages:
            lang_matches = set(patient.preferred_languages).intersection(set(caregiver.languages))
            if lang_matches:
                reasons.append(f"Speaks: {', '.join(lang_matches)}")
        
        # Experience
        if caregiver.experience_years >= 5:
            reasons.append(f"{int(caregiver.experience_years)} years experience")
        
        # Rating
        if caregiver.rating and caregiver.rating >= 4.5:
            reasons.append(f"Highly rated: {caregiver.rating:.1f}/5.0")
        
        # Cultural match
        if patient.cultural_preferences and caregiver.cultural_competencies:
            cultural_matches = set(patient.cultural_preferences).intersection(
                set(caregiver.cultural_competencies)
            )
            if cultural_matches:
                reasons.append(f"Cultural fit: {', '.join(list(cultural_matches)[:2])}")
        
        return reasons[:5]
    
    def _check_warnings(
        self,
        patient: PatientProfile,
        caregiver: CaregiverProfile
    ) -> Optional[List[str]]:
        """Check for any warnings or concerns"""
        warnings = []
        
        # Check distance
        if patient.location and caregiver.location:
            distance = self._haversine_distance(
                patient.location.get("lat", 0),
                patient.location.get("lng", 0),
                caregiver.location.get("lat", 0),
                caregiver.location.get("lng", 0)
            )
            if distance > 30:
                warnings.append(f"Long travel distance: {distance:.1f} miles")
        
        # Check missing required skills
        if patient.required_skills and caregiver.skills:
            missing_skills = set(patient.required_skills) - set(caregiver.skills)
            if missing_skills:
                warnings.append(f"Missing skills: {', '.join(list(missing_skills)[:2])}")
        
        # Check language barriers
        if patient.preferred_languages and caregiver.languages:
            if not set(patient.preferred_languages).intersection(set(caregiver.languages)):
                if "english" not in [lang.lower() for lang in caregiver.languages]:
                    warnings.append("Potential language barrier")
        
        return warnings if warnings else None
    
    def _generate_explanation(
        self,
        patient: PatientProfile,
        caregiver: CaregiverProfile,
        scores: Dict[str, float],
        overall_score: float
    ) -> str:
        """Generate a human-readable explanation of the match"""
        quality = self._determine_match_quality(overall_score)
        
        explanation = f"This is a {quality.value} match with a score of {overall_score:.0%}. "
        
        # Top contributing factors
        sorted_factors = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        top_factors = [f for f in sorted_factors if f[1] > 0][:3]
        
        if top_factors:
            factor_strs = [f"{f[0].replace('_', ' ')}" for f in top_factors]
            explanation += f"Key strengths include {', '.join(factor_strs)}."
        
        return explanation


async def process_matching_request(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """Process matching request from Kafka"""
    engine = MatchingEngine()
    
    patient = PatientProfile(**request_data.get("patient", {}))
    caregivers = [
        CaregiverProfile(**cg) 
        for cg in request_data.get("caregivers", [])
    ]
    matching_types = [
        MatchingType(mt) 
        for mt in request_data.get("matching_types", ["comprehensive"])
    ]
    
    matches = await engine.find_matches(patient, caregivers, matching_types)
    
    return {
        "patient_id": patient.id,
        "matches": [m.model_dump() for m in matches],
        "total_matches": len(matches)
    }

