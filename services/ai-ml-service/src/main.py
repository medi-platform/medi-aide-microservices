"""
Medi-Aide AI/ML Service - Enterprise Main Application
Production-ready FastAPI application with comprehensive features
"""

import asyncio
import logging
import sys
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Dict

import structlog
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator

from src.config import settings
from src.infrastructure.logging import setup_logging
from src.infrastructure.database import init_database, close_database
from src.infrastructure.redis_client import init_redis, close_redis
from src.infrastructure.kafka_client import init_kafka, close_kafka
from src.infrastructure.consul_client import register_service, deregister_service
from src.infrastructure.tracing import setup_tracing

# Import API routers
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

# Setup structured logging
setup_logging()
logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager
    Handles startup and shutdown events
    """
    # =========================================================================
    # STARTUP
    # =========================================================================
    logger.info(
        "Starting Medi-Aide AI/ML Service",
        version=settings.app_version,
        environment=settings.environment,
        port=settings.port
    )
    
    try:
        # Initialize database connection pool (graceful failure)
        logger.info("Initializing database connection...")
        try:
            await init_database()
            logger.info("Database connection established")
        except Exception as db_error:
            logger.warning("Database unavailable - running in degraded mode", error=str(db_error))
        
        # Initialize Redis connection (graceful failure)
        logger.info("Initializing Redis connection...")
        try:
            await init_redis()
            logger.info("Redis connection established")
        except Exception as redis_error:
            logger.warning("Redis unavailable - caching disabled", error=str(redis_error))
        
        # Initialize Kafka consumers (if enabled, graceful failure)
        if settings.kafka.brokers:
            logger.info("Initializing Kafka consumers...")
            try:
                await init_kafka()
                logger.info("Kafka consumers initialized")
            except Exception as kafka_error:
                logger.warning("Kafka unavailable - event processing disabled", error=str(kafka_error))
        
        # Register with Consul (if enabled)
        if settings.consul.enabled:
            logger.info("Registering with Consul...")
            try:
                await register_service()
                logger.info("Service registered with Consul")
            except Exception as consul_error:
                logger.warning("Consul unavailable - service discovery disabled", error=str(consul_error))
        
        # Setup OpenTelemetry tracing
        try:
            setup_tracing(app)
            logger.info("Tracing initialized")
        except Exception as tracing_error:
            logger.warning("Tracing unavailable", error=str(tracing_error))
        
        logger.info(
            "AI/ML Service started successfully",
            services=[
                "matching", "recommendations", "analysis", "chat",
                "scheduling", "wellness", "care_plans", "compliance",
                "explainability", "predictive"
            ]
        )
        
    except Exception as e:
        logger.error("Failed to start service", error=str(e))
        raise
    
    yield
    
    # =========================================================================
    # SHUTDOWN
    # =========================================================================
    logger.info("Shutting down AI/ML Service...")
    
    try:
        # Deregister from Consul
        if settings.consul.enabled:
            await deregister_service()
            logger.info("Deregistered from Consul")
        
        # Close Kafka connections
        await close_kafka()
        logger.info("Kafka connections closed")
        
        # Close Redis connection
        await close_redis()
        logger.info("Redis connection closed")
        
        # Close database connections
        await close_database()
        logger.info("Database connections closed")
        
    except Exception as e:
        logger.error("Error during shutdown", error=str(e))
    
    logger.info("AI/ML Service shutdown complete")


# =============================================================================
# CREATE APPLICATION
# =============================================================================
app = FastAPI(
    title=settings.app_name,
    description="""
    ## Medi-Aide AI/ML Service
    
    Enterprise-grade AI microservice providing:
    
    - **Matching Engine**: Caregiver-patient matching with cultural alignment
    - **Recommendations**: Wellness, training, and care plan recommendations
    - **Text Analysis**: Sentiment analysis, moderation, and NLP
    - **Conversational AI**: Chat support and wellness chatbot
    - **Schedule Optimization**: Route and shift optimization
    - **Wellness Predictions**: Burnout risk and intervention suggestions
    - **Care Plan Assistant**: AI-powered care plan generation
    - **Compliance Prediction**: Risk assessment and compliance scoring
    - **Explainability**: AI decision explanations for transparency
    - **Predictive Analytics**: General healthcare predictions
    
    ### Authentication
    
    API key authentication via `X-API-Key` header (when enabled).
    
    ### Rate Limiting
    
    - Standard endpoints: 100 requests/minute
    - Heavy compute endpoints: 10 requests/minute
    
    ### Health Checks
    
    - `/health/live` - Liveness probe
    - `/health/ready` - Readiness probe
    - `/health/detailed` - Detailed health status
    """,
    version=settings.app_version,
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
    openapi_url="/openapi.json" if settings.is_development else "/api/openapi.json",
    lifespan=lifespan,
)


# =============================================================================
# MIDDLEWARE
# =============================================================================

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Process-Time"],
)

# Gzip compression for responses > 500 bytes
app.add_middleware(GZipMiddleware, minimum_size=500)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time and request ID to response headers"""
    import uuid
    from time import perf_counter
    
    start_time = perf_counter()
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    
    # Add request ID to state for logging
    request.state.request_id = request_id
    
    response = await call_next(request)
    
    process_time = perf_counter() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}"
    response.headers["X-Request-ID"] = request_id
    
    # Log request (skip health checks)
    if not request.url.path.startswith("/health"):
        logger.info(
            "Request completed",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            process_time=f"{process_time:.4f}s"
        )
    
    return response


@app.middleware("http")
async def api_key_validation(request: Request, call_next):
    """Validate API key if configured"""
    # Skip validation for health endpoints and docs
    skip_paths = ["/health", "/docs", "/redoc", "/openapi.json", "/metrics"]
    if any(request.url.path.startswith(path) for path in skip_paths):
        return await call_next(request)
    
    # Check API key if configured
    if settings.api_key:
        api_key = request.headers.get("X-API-Key")
        if api_key != settings.api_key:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"error": "Invalid or missing API key"}
            )
    
    return await call_next(request)


# =============================================================================
# PROMETHEUS METRICS
# =============================================================================
if settings.observability.metrics_enabled:
    instrumentator = Instrumentator(
        should_group_status_codes=True,
        should_group_untemplated=True,
        should_respect_env_var=True,
        should_instrument_requests_inprogress=True,
        excluded_handlers=["/health/*", "/metrics"],
        inprogress_name="ai_ml_inprogress",
        inprogress_labels=True,
    )
    instrumentator.instrument(app).expose(
        app, 
        endpoint=settings.observability.metrics_path,
        include_in_schema=False
    )


# =============================================================================
# EXCEPTION HANDLERS
# =============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    request_id = getattr(request.state, "request_id", "unknown")
    
    logger.error(
        "Unhandled exception",
        request_id=request_id,
        path=request.url.path,
        error=str(exc),
        exc_info=True
    )
    
    # Don't expose internal errors in production
    if settings.is_production:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Internal server error",
                "request_id": request_id
            }
        )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": str(exc),
            "type": type(exc).__name__,
            "request_id": request_id
        }
    )


# =============================================================================
# INCLUDE ROUTERS
# =============================================================================

# Health endpoints (no prefix)
app.include_router(health_router, tags=["Health"])

# API v1 endpoints
API_V1_PREFIX = "/api/v1"

app.include_router(
    matching_router,
    prefix=f"{API_V1_PREFIX}/matching",
    tags=["Matching Engine"]
)

app.include_router(
    recommendations_router,
    prefix=f"{API_V1_PREFIX}/recommendations",
    tags=["Recommendations"]
)

app.include_router(
    analysis_router,
    prefix=f"{API_V1_PREFIX}/text-analysis",
    tags=["Text Analysis"]
)

app.include_router(
    chat_router,
    prefix=f"{API_V1_PREFIX}/chat",
    tags=["Conversational AI"]
)

app.include_router(
    scheduling_router,
    prefix=f"{API_V1_PREFIX}/schedule",
    tags=["Schedule Optimization"]
)

app.include_router(
    wellness_router,
    prefix=f"{API_V1_PREFIX}/wellness",
    tags=["Wellness AI"]
)

app.include_router(
    care_plans_router,
    prefix=f"{API_V1_PREFIX}/care-plans",
    tags=["Care Plan AI"]
)

app.include_router(
    compliance_router,
    prefix=f"{API_V1_PREFIX}/compliance",
    tags=["Compliance Prediction"]
)

app.include_router(
    explainability_router,
    prefix=f"{API_V1_PREFIX}/explainability",
    tags=["AI Explainability"]
)

app.include_router(
    predictive_router,
    prefix=f"{API_V1_PREFIX}/predictive",
    tags=["Predictive Analytics"]
)


# =============================================================================
# ROOT ENDPOINT
# =============================================================================

@app.get("/", include_in_schema=False)
async def root() -> Dict[str, Any]:
    """Root endpoint with service information"""
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "status": "operational",
        "environment": settings.environment,
        "timestamp": datetime.utcnow().isoformat(),
        "endpoints": {
            "matching": f"{API_V1_PREFIX}/matching",
            "recommendations": f"{API_V1_PREFIX}/recommendations",
            "text_analysis": f"{API_V1_PREFIX}/text-analysis",
            "chat": f"{API_V1_PREFIX}/chat",
            "schedule": f"{API_V1_PREFIX}/schedule",
            "wellness": f"{API_V1_PREFIX}/wellness",
            "care_plans": f"{API_V1_PREFIX}/care-plans",
            "compliance": f"{API_V1_PREFIX}/compliance",
            "explainability": f"{API_V1_PREFIX}/explainability",
            "predictive": f"{API_V1_PREFIX}/predictive",
        },
        "health": "/health/ready",
        "metrics": settings.observability.metrics_path,
        "documentation": "/docs" if settings.is_development else None
    }


# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        workers=settings.workers if settings.is_production else 1,
        reload=settings.is_development,
        log_level=settings.observability.log_level.lower(),
        access_log=True,
    )

