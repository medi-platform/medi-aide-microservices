"""
API Routes for AI/ML Service
"""

from src.api.health import router as health_router
from src.api.matching import router as matching_router
from src.api.recommendations import router as recommendations_router
from src.api.analysis import router as analysis_router
from src.api.chat import router as chat_router
from src.api.scheduling import router as scheduling_router
from src.api.wellness import router as wellness_router
from src.api.care_plans import router as care_plans_router
from src.api.compliance import router as compliance_router
from src.api.explainability import router as explainability_router
from src.api.predictive import router as predictive_router

__all__ = [
    "health_router",
    "matching_router",
    "recommendations_router",
    "analysis_router",
    "chat_router",
    "scheduling_router",
    "wellness_router",
    "care_plans_router",
    "compliance_router",
    "explainability_router",
    "predictive_router",
]

