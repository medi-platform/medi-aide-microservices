"""
Health Check Endpoints
Kubernetes-compatible liveness and readiness probes
"""

from datetime import datetime
from typing import Dict, Any

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from src.config import settings
from src.infrastructure.database import check_database_health
from src.infrastructure.redis_client import check_redis_health
from src.infrastructure.kafka_client import check_kafka_health
from src.infrastructure.consul_client import check_consul_health

router = APIRouter()


@router.get("/health/live", status_code=status.HTTP_200_OK)
async def liveness_probe() -> Dict[str, str]:
    """
    Kubernetes liveness probe
    Returns 200 if the service is running
    """
    return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}


@router.get("/health/ready")
async def readiness_probe() -> JSONResponse:
    """
    Kubernetes readiness probe
    Returns 200 if the service is ready to accept traffic
    """
    checks = {}
    overall_healthy = True
    
    # Check database
    db_health = await check_database_health()
    checks["database"] = db_health
    if db_health["status"] != "healthy":
        overall_healthy = False
    
    # Check Redis (degraded OK - caching is optional)
    redis_health = await check_redis_health()
    checks["redis"] = redis_health
    
    response = {
        "status": "ready" if overall_healthy else "not_ready",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": checks
    }
    
    return JSONResponse(
        content=response,
        status_code=status.HTTP_200_OK if overall_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    )


@router.get("/health/detailed")
async def detailed_health() -> Dict[str, Any]:
    """
    Detailed health check for monitoring and debugging
    """
    checks = {}
    
    # Database health
    checks["database"] = await check_database_health()
    
    # Redis health
    checks["redis"] = await check_redis_health()
    
    # Kafka health
    checks["kafka"] = await check_kafka_health()
    
    # Consul health
    checks["consul"] = await check_consul_health()
    
    # Calculate overall status
    statuses = [c.get("status", "unknown") for c in checks.values()]
    if all(s == "healthy" for s in statuses):
        overall = "healthy"
    elif any(s == "unhealthy" for s in statuses):
        overall = "degraded"
    else:
        overall = "partial"
    
    return {
        "status": overall,
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "timestamp": datetime.utcnow().isoformat(),
        "checks": checks,
        "capabilities": {
            "matching": True,
            "recommendations": True,
            "text_analysis": True,
            "chat": True,
            "scheduling": True,
            "wellness": True,
            "care_plans": True,
            "compliance": True,
            "explainability": settings.ai.enable_explainability,
            "cultural_matching": settings.ai.enable_cultural_matching,
        }
    }


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Simple health check endpoint (legacy compatibility)
    """
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/ping")
async def ping() -> Dict[str, str]:
    """Simple ping endpoint"""
    return {"pong": datetime.utcnow().isoformat()}

