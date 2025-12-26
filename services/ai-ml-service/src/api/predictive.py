"""
Predictive Analytics API
General healthcare predictions and forecasting
"""

from datetime import datetime, date
from typing import Any, Dict, List, Optional
from uuid import uuid4
from enum import Enum

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.services.predictive.engine import PredictiveEngine

router = APIRouter()

# Initialize predictive engine
predictive_engine = PredictiveEngine()


# =============================================================================
# ENUMS AND MODELS
# =============================================================================

class PredictionType(str, Enum):
    DEMAND_FORECAST = "demand_forecast"
    CHURN_RISK = "churn_risk"
    READMISSION_RISK = "readmission_risk"
    COST_PREDICTION = "cost_prediction"
    STAFFING_NEEDS = "staffing_needs"
    TASK_DURATION = "task_duration"
    NO_SHOW_RISK = "no_show_risk"


class TimeHorizon(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"


class PredictionRequest(BaseModel):
    """General prediction request"""
    prediction_type: PredictionType
    entity_id: Optional[str] = None
    entity_type: Optional[str] = None
    features: Dict[str, Any]
    horizon: Optional[TimeHorizon] = None
    include_confidence_interval: bool = True
    
    model_config = {"json_schema_extra": {
        "example": {
            "prediction_type": "churn_risk",
            "entity_id": "caregiver-123",
            "entity_type": "caregiver",
            "features": {
                "tenure_months": 18,
                "satisfaction_score": 6.5,
                "overtime_hours_avg": 8,
                "missed_shifts_30d": 2
            }
        }
    }}


class PredictionResponse(BaseModel):
    """Prediction response"""
    request_id: str
    timestamp: datetime
    prediction_type: str
    prediction: Any
    probability: Optional[float] = None
    confidence_interval: Optional[Dict[str, float]] = None
    key_factors: Optional[List[Dict[str, Any]]] = None
    recommendations: Optional[List[str]] = None


class DemandForecastRequest(BaseModel):
    """Demand forecasting request"""
    agency_id: str
    start_date: date
    end_date: date
    granularity: TimeHorizon = TimeHorizon.DAILY
    service_types: Optional[List[str]] = None
    regions: Optional[List[str]] = None


class TaskDurationRequest(BaseModel):
    """Task duration prediction request"""
    task_type: str
    patient_id: Optional[str] = None
    caregiver_id: Optional[str] = None
    patient_factors: Optional[Dict[str, Any]] = None
    historical_durations: Optional[List[int]] = None


class ChurnRiskRequest(BaseModel):
    """Churn risk prediction request"""
    entity_type: str = Field(description="caregiver, patient, agency")
    entity_id: str
    features: Dict[str, Any]


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/predict", response_model=PredictionResponse)
async def make_prediction(request: PredictionRequest):
    """
    Make a general prediction
    
    Supported prediction types:
    - **demand_forecast**: Predict care demand
    - **churn_risk**: Predict likelihood of churn
    - **readmission_risk**: Predict hospital readmission
    - **cost_prediction**: Predict care costs
    - **staffing_needs**: Predict staffing requirements
    - **task_duration**: Predict task completion time
    - **no_show_risk**: Predict visit no-show probability
    """
    request_id = str(uuid4())
    
    try:
        result = await predictive_engine.predict(
            prediction_type=request.prediction_type,
            entity_id=request.entity_id,
            entity_type=request.entity_type,
            features=request.features,
            horizon=request.horizon,
            include_ci=request.include_confidence_interval
        )
        
        return PredictionResponse(
            request_id=request_id,
            timestamp=datetime.utcnow(),
            prediction_type=request.prediction_type.value,
            prediction=result["prediction"],
            probability=result.get("probability"),
            confidence_interval=result.get("confidence_interval"),
            key_factors=result.get("factors"),
            recommendations=result.get("recommendations")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/demand-forecast")
async def forecast_demand(request: DemandForecastRequest):
    """
    Forecast care demand for an agency
    """
    try:
        forecast = await predictive_engine.forecast_demand(
            agency_id=request.agency_id,
            start_date=request.start_date,
            end_date=request.end_date,
            granularity=request.granularity,
            service_types=request.service_types,
            regions=request.regions
        )
        
        return {
            "agency_id": request.agency_id,
            "forecast_period": {
                "start": request.start_date.isoformat(),
                "end": request.end_date.isoformat()
            },
            "granularity": request.granularity.value,
            "forecasts": forecast["predictions"],
            "confidence_intervals": forecast["intervals"],
            "summary": forecast["summary"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/task-duration")
async def predict_task_duration(request: TaskDurationRequest):
    """
    Predict task completion duration
    """
    try:
        prediction = await predictive_engine.predict_task_duration(
            task_type=request.task_type,
            patient_id=request.patient_id,
            caregiver_id=request.caregiver_id,
            patient_factors=request.patient_factors,
            historical_durations=request.historical_durations
        )
        
        return {
            "task_type": request.task_type,
            "predicted_duration_minutes": prediction["duration"],
            "confidence_interval": prediction["interval"],
            "factors_considered": prediction["factors"],
            "comparison_to_average": prediction["vs_average"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/churn-risk")
async def predict_churn_risk(request: ChurnRiskRequest):
    """
    Predict churn risk for an entity
    """
    prediction_request = PredictionRequest(
        prediction_type=PredictionType.CHURN_RISK,
        entity_id=request.entity_id,
        entity_type=request.entity_type,
        features=request.features
    )
    
    return await make_prediction(prediction_request)


@router.post("/batch-predict")
async def batch_predict(
    prediction_type: PredictionType,
    entities: List[Dict[str, Any]]
):
    """
    Make predictions for multiple entities
    """
    try:
        results = await predictive_engine.batch_predict(
            prediction_type=prediction_type,
            entities=entities
        )
        
        return {
            "prediction_type": prediction_type.value,
            "total_entities": len(entities),
            "predictions": results["predictions"],
            "summary": results["summary"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/model-info/{prediction_type}")
async def get_model_info(prediction_type: PredictionType):
    """
    Get information about a prediction model
    """
    try:
        info = await predictive_engine.get_model_info(prediction_type)
        return {
            "prediction_type": prediction_type.value,
            "model_type": info["type"],
            "version": info["version"],
            "training_date": info["trained"],
            "metrics": info["metrics"],
            "features_used": info["features"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/types")
async def get_prediction_types():
    """Get available prediction types"""
    return {
        "prediction_types": {
            "demand_forecast": {
                "description": "Predict future care demand",
                "entity_types": ["agency"],
                "horizons": ["daily", "weekly", "monthly"]
            },
            "churn_risk": {
                "description": "Predict likelihood of leaving",
                "entity_types": ["caregiver", "patient"],
                "output": "probability"
            },
            "readmission_risk": {
                "description": "Predict hospital readmission risk",
                "entity_types": ["patient"],
                "output": "probability"
            },
            "cost_prediction": {
                "description": "Predict care costs",
                "entity_types": ["patient", "agency"],
                "output": "amount"
            },
            "staffing_needs": {
                "description": "Predict staffing requirements",
                "entity_types": ["agency"],
                "horizons": ["daily", "weekly"]
            },
            "task_duration": {
                "description": "Predict task completion time",
                "entity_types": ["task"],
                "output": "minutes"
            },
            "no_show_risk": {
                "description": "Predict visit no-show probability",
                "entity_types": ["visit"],
                "output": "probability"
            }
        }
    }


@router.get("/health")
async def health_check():
    """Health check for predictive service"""
    return {
        "status": "healthy",
        "service": "predictive-analytics",
        "prediction_types": [t.value for t in PredictionType],
        "version": "1.0.0"
    }

