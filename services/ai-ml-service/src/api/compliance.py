"""
Compliance Prediction API
Risk assessment and compliance scoring
"""

from datetime import datetime, date
from typing import Any, Dict, List, Optional
from uuid import uuid4
from enum import Enum

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.services.compliance.engine import ComplianceEngine

router = APIRouter()

# Initialize compliance engine
compliance_engine = ComplianceEngine()


# =============================================================================
# ENUMS AND MODELS
# =============================================================================

class ComplianceCategory(str, Enum):
    DOCUMENTATION = "documentation"
    TRAINING = "training"
    SCHEDULING = "scheduling"
    VISIT = "visit"
    BILLING = "billing"
    SAFETY = "safety"
    REGULATORY = "regulatory"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ComplianceIssue(BaseModel):
    """Compliance issue"""
    id: str
    category: ComplianceCategory
    description: str
    severity: RiskLevel
    regulation: Optional[str] = None
    deadline: Optional[date] = None
    remediation_steps: Optional[List[str]] = None


class EntityComplianceRequest(BaseModel):
    """Entity compliance assessment request"""
    entity_type: str = Field(description="agency, caregiver, patient")
    entity_id: str
    categories: Optional[List[ComplianceCategory]] = None
    include_history: bool = False
    
    model_config = {"json_schema_extra": {
        "example": {
            "entity_type": "agency",
            "entity_id": "agency-123",
            "categories": ["documentation", "training", "regulatory"]
        }
    }}


class ComplianceScoreResponse(BaseModel):
    """Compliance score response"""
    request_id: str
    timestamp: datetime
    entity_type: str
    entity_id: str
    overall_score: float = Field(ge=0, le=100)
    risk_level: RiskLevel
    category_scores: Dict[str, float]
    issues: List[ComplianceIssue]
    trend: str
    recommendations: List[Dict[str, Any]]


class CompliancePredictionRequest(BaseModel):
    """Compliance risk prediction request"""
    entity_type: str
    entity_id: str
    prediction_horizon_days: int = Field(default=30, ge=7, le=365)
    risk_factors: Optional[Dict[str, Any]] = None


class AuditReadinessRequest(BaseModel):
    """Audit readiness assessment request"""
    agency_id: str
    audit_type: str = Field(description="regulatory, internal, accreditation")
    audit_date: Optional[date] = None


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/assess", response_model=ComplianceScoreResponse)
async def assess_compliance(request: EntityComplianceRequest):
    """
    Assess compliance for an entity
    
    Evaluates:
    - Documentation completeness
    - Training requirements
    - Visit documentation
    - Billing accuracy
    - Safety protocols
    - Regulatory adherence
    """
    request_id = str(uuid4())
    
    try:
        result = await compliance_engine.assess(
            entity_type=request.entity_type,
            entity_id=request.entity_id,
            categories=request.categories,
            include_history=request.include_history
        )
        
        return ComplianceScoreResponse(
            request_id=request_id,
            timestamp=datetime.utcnow(),
            entity_type=request.entity_type,
            entity_id=request.entity_id,
            overall_score=result["overall_score"],
            risk_level=RiskLevel(result["risk_level"]),
            category_scores=result["category_scores"],
            issues=result["issues"],
            trend=result["trend"],
            recommendations=result["recommendations"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict-risk")
async def predict_compliance_risk(request: CompliancePredictionRequest):
    """
    Predict future compliance risks
    """
    try:
        predictions = await compliance_engine.predict_risk(
            entity_type=request.entity_type,
            entity_id=request.entity_id,
            horizon_days=request.prediction_horizon_days,
            risk_factors=request.risk_factors
        )
        
        return {
            "entity_id": request.entity_id,
            "prediction_horizon_days": request.prediction_horizon_days,
            "predicted_risks": predictions["risks"],
            "probability_of_issue": predictions["probability"],
            "preventive_actions": predictions["actions"],
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/audit-readiness")
async def assess_audit_readiness(request: AuditReadinessRequest):
    """
    Assess readiness for an audit
    """
    try:
        readiness = await compliance_engine.assess_audit_readiness(
            agency_id=request.agency_id,
            audit_type=request.audit_type,
            audit_date=request.audit_date
        )
        
        return {
            "agency_id": request.agency_id,
            "audit_type": request.audit_type,
            "readiness_score": readiness["score"],
            "status": readiness["status"],
            "gaps": readiness["gaps"],
            "action_items": readiness["actions"],
            "estimated_prep_hours": readiness["prep_hours"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/requirements/{entity_type}")
async def get_compliance_requirements(
    entity_type: str,
    jurisdiction: Optional[str] = None
):
    """
    Get compliance requirements for an entity type
    """
    try:
        requirements = await compliance_engine.get_requirements(
            entity_type=entity_type,
            jurisdiction=jurisdiction
        )
        return requirements
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{entity_id}")
async def get_compliance_history(
    entity_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """
    Get compliance history for an entity
    """
    try:
        history = await compliance_engine.get_history(
            entity_id=entity_id,
            start_date=start_date,
            end_date=end_date
        )
        return {
            "entity_id": entity_id,
            "assessments": history["assessments"],
            "score_trend": history["trend"],
            "resolved_issues": history["resolved"],
            "recurring_issues": history["recurring"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories")
async def get_compliance_categories():
    """Get compliance categories and descriptions"""
    return {
        "categories": {
            "documentation": {
                "description": "Care documentation completeness and accuracy",
                "weight": 0.20
            },
            "training": {
                "description": "Staff training and certification requirements",
                "weight": 0.15
            },
            "scheduling": {
                "description": "Scheduling compliance and overtime rules",
                "weight": 0.10
            },
            "visit": {
                "description": "Visit verification and EVV compliance",
                "weight": 0.20
            },
            "billing": {
                "description": "Billing accuracy and timeliness",
                "weight": 0.15
            },
            "safety": {
                "description": "Safety protocols and incident reporting",
                "weight": 0.10
            },
            "regulatory": {
                "description": "Regulatory requirements and licensing",
                "weight": 0.10
            }
        }
    }


@router.get("/health")
async def health_check():
    """Health check for compliance service"""
    return {
        "status": "healthy",
        "service": "compliance-prediction",
        "categories": [c.value for c in ComplianceCategory],
        "version": "1.0.0"
    }

