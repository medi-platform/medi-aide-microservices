"""
OpenTelemetry Tracing Configuration
Distributed tracing for observability
"""

from typing import Optional

import structlog
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.semconv.resource import ResourceAttributes

from src.config import settings

logger = structlog.get_logger(__name__)

_tracer: Optional[trace.Tracer] = None


def setup_tracing(app) -> None:
    """Configure OpenTelemetry tracing"""
    global _tracer
    
    try:
        # Create resource with service info
        resource = Resource.create({
            ResourceAttributes.SERVICE_NAME: settings.consul.service_name,
            ResourceAttributes.SERVICE_VERSION: settings.app_version,
            ResourceAttributes.DEPLOYMENT_ENVIRONMENT: settings.environment,
        })
        
        # Create tracer provider
        tracer_provider = TracerProvider(resource=resource)
        
        # Configure Jaeger exporter
        jaeger_exporter = JaegerExporter(
            agent_host_name=settings.observability.jaeger_agent_host,
            agent_port=settings.observability.jaeger_agent_port,
        )
        
        # Add span processor
        tracer_provider.add_span_processor(
            BatchSpanProcessor(jaeger_exporter)
        )
        
        # Set as global tracer provider
        trace.set_tracer_provider(tracer_provider)
        
        # Get tracer instance
        _tracer = trace.get_tracer(__name__)
        
        # Instrument FastAPI
        FastAPIInstrumentor.instrument_app(
            app,
            tracer_provider=tracer_provider,
            excluded_urls="health/*,metrics"
        )
        
        # Instrument HTTP clients
        HTTPXClientInstrumentor().instrument()
        
        # Instrument Redis
        RedisInstrumentor().instrument()
        
        logger.info(
            "Tracing configured",
            jaeger_host=settings.observability.jaeger_agent_host,
            jaeger_port=settings.observability.jaeger_agent_port
        )
        
    except Exception as e:
        logger.warning("Failed to configure tracing", error=str(e))


def get_tracer() -> Optional[trace.Tracer]:
    """Get the configured tracer instance"""
    return _tracer


def create_span(name: str, attributes: dict = None):
    """Create a new span for tracing"""
    if _tracer:
        return _tracer.start_as_current_span(
            name,
            attributes=attributes or {}
        )
    
    # Return a no-op context manager if tracing not configured
    from contextlib import nullcontext
    return nullcontext()

