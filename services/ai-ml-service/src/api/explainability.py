"""
AI Explainability API
Explanations for AI decisions and predictions
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4
from enum import Enum

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.services.explainability.engine import ExplainabilityEngine
from src.config import settings

router = APIRouter()

# Initialize explainability engine
explainability_engine = ExplainabilityEngine()


# =============================================================================
# ENUMS AND MODELS
# =============================================================================

class DecisionType(str, Enum):
    MATCHING = "matching"
    RECOMMENDATION = "recommendation"
    RISK_PREDICTION = "risk_prediction"
    SCHEDULING = "scheduling"
    CARE_PLAN = "care_plan"
    COMPLIANCE = "compliance"


class ExplanationFormat(str, Enum):
    SIMPLE = "simple"
    DETAILED = "detailed"
    TECHNICAL = "technical"


class FactorContribution(BaseModel):
    """Factor contribution to a decision"""
    factor: str
    contribution: float = Field(ge=-1, le=1)
    direction: str = Field(description="positive, negative, neutral")
    description: str
    importance_rank: int


class ExplanationRequest(BaseModel):
    """Explanation request"""
    decision_type: DecisionType
    decision_id: str
    decision_data: Dict[str, Any]
    format: ExplanationFormat = ExplanationFormat.SIMPLE
    audience: str = Field(default="user", description="user, admin, auditor")
    
    model_config = {"json_schema_extra": {
        "example": {
            "decision_type": "matching",
            "decision_id": "match-123",
            "decision_data": {
                "patient_id": "patient-456",
                "caregiver_id": "caregiver-789",
                "match_score": 0.87
            },
            "format": "simple"
        }
    }}


class ExplanationResponse(BaseModel):
    """Explanation response"""
    request_id: str
    timestamp: datetime
    decision_type: str
    decision_id: str
    summary: str
    factors: List[FactorContribution]
    counterfactuals: Optional[List[Dict[str, Any]]] = None
    confidence: float
    limitations: Optional[List[str]] = None


class MatchExplanationRequest(BaseModel):
    """Match explanation request"""
    match_id: str
    patient_id: str
    caregiver_id: str
    match_score: float
    match_factors: Dict[str, float]


class RiskExplanationRequest(BaseModel):
    """Risk prediction explanation request"""
    prediction_id: str
    entity_id: str
    risk_type: str
    risk_score: float
    input_features: Dict[str, Any]


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/explain", response_model=ExplanationResponse)
async def explain_decision(request: ExplanationRequest):
    """
    Generate explanation for an AI decision
    
    Supports multiple decision types:
    - **matching**: Why was this caregiver matched?
    - **recommendation**: Why is this being recommended?
    - **risk_prediction**: Why is this risk level predicted?
    - **scheduling**: Why was this schedule created?
    - **care_plan**: Why are these activities recommended?
    - **compliance**: Why is this compliance score given?
    """
    if not settings.ai.enable_explainability:
        raise HTTPException(
            status_code=503,
            detail="Explainability feature is disabled"
        )
    
    request_id = str(uuid4())
    
    try:
        explanation = await explainability_engine.explain(
            decision_type=request.decision_type,
            decision_id=request.decision_id,
            decision_data=request.decision_data,
            format=request.format,
            audience=request.audience
        )
        
        return ExplanationResponse(
            request_id=request_id,
            timestamp=datetime.utcnow(),
            decision_type=request.decision_type.value,
            decision_id=request.decision_id,
            summary=explanation["summary"],
            factors=explanation["factors"],
            counterfactuals=explanation.get("counterfactuals"),
            confidence=explanation["confidence"],
            limitations=explanation.get("limitations")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/explain-match")
async def explain_match(request: MatchExplanationRequest):
    """
    Explain a caregiver-patient match
    (Legacy compatibility endpoint)
    """
    explanation_request = ExplanationRequest(
        decision_type=DecisionType.MATCHING,
        decision_id=request.match_id,
        decision_data={
            "patient_id": request.patient_id,
            "caregiver_id": request.caregiver_id,
            "match_score": request.match_score,
            "factors": request.match_factors
        }
    )
    
    return await explain_decision(explanation_request)


@router.post("/explain-risk")
async def explain_risk(request: RiskExplanationRequest):
    """
    Explain a risk prediction
    (Legacy compatibility endpoint)
    """
    explanation_request = ExplanationRequest(
        decision_type=DecisionType.RISK_PREDICTION,
        decision_id=request.prediction_id,
        decision_data={
            "entity_id": request.entity_id,
            "risk_type": request.risk_type,
            "risk_score": request.risk_score,
            "features": request.input_features
        }
    )
    
    return await explain_decision(explanation_request)


@router.get("/what-if/{decision_type}/{decision_id}")
async def what_if_analysis(
    decision_type: DecisionType,
    decision_id: str,
    changes: str  # JSON string of proposed changes
):
    """
    Perform what-if analysis on a decision
    """
    import json
    
    try:
        proposed_changes = json.loads(changes)
        
        result = await explainability_engine.what_if(
            decision_type=decision_type,
            decision_id=decision_id,
            proposed_changes=proposed_changes
        )
        
        return {
            "decision_id": decision_id,
            "original_outcome": result["original"],
            "proposed_changes": proposed_changes,
            "predicted_outcome": result["predicted"],
            "outcome_change": result["change"],
            "confidence": result["confidence"]
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in changes parameter")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/feature-importance/{decision_type}")
async def get_feature_importance(decision_type: DecisionType):
    """
    Get global feature importance for a decision type
    """
    try:
        importance = await explainability_engine.get_feature_importance(decision_type)
        return {
            "decision_type": decision_type.value,
            "features": importance["features"],
            "model_type": importance["model_type"],
            "last_updated": importance["updated"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/audit-trail/{decision_id}")
async def get_decision_audit_trail(decision_id: str):
    """
    Get audit trail for a decision
    """
    try:
        trail = await explainability_engine.get_audit_trail(decision_id)
        return {
            "decision_id": decision_id,
            "events": trail["events"],
            "model_version": trail["model_version"],
            "input_snapshot": trail["inputs"],
            "output_snapshot": trail["outputs"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/formats")
async def get_explanation_formats():
    """Get available explanation formats"""
    return {
        "formats": {
            "simple": {
                "description": "Plain language summary for end users",
                "includes": ["summary", "top_factors", "confidence"]
            },
            "detailed": {
                "description": "Comprehensive explanation with all factors",
                "includes": ["summary", "all_factors", "counterfactuals", "confidence", "limitations"]
            },
            "technical": {
                "description": "Technical details for auditing",
                "includes": ["all_factors", "model_details", "feature_values", "shap_values"]
            }
        },
        "decision_types": [t.value for t in DecisionType],
        "feature_enabled": settings.ai.enable_explainability
    }


@router.get("/health")
async def health_check():
    """Health check for explainability service"""
    return {
        "status": "healthy",
        "service": "ai-explainability",
        "enabled": settings.ai.enable_explainability,
        "decision_types": [t.value for t in DecisionType],
        "version": "1.0.0"
    }

