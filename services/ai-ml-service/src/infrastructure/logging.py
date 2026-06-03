"""
Structured Logging Configuration
Enterprise-grade logging with structlog
"""

import logging
import sys
from typing import Any, Dict

import structlog
from structlog.types import Processor

from src.config import settings


def setup_logging() -> None:
    """
    Configure structured logging for the application
    Uses JSON format in production, colored console in development
    """
    
    # Shared processors for all environments
    shared_processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.TimeStamper(fmt="iso"),
    ]
    
    if settings.is_production or settings.observability.log_format == "json":
        # Production: JSON format for log aggregation
        processors = shared_processors + [
            structlog.processors.dict_tracebacks,
            structlog.processors.JSONRenderer(),
        ]
        
        # Configure standard logging
        logging.basicConfig(
            format="%(message)s",
            stream=sys.stdout,
            level=getattr(logging, settings.observability.log_level.upper()),
        )
    else:
        # Development: Colored console output
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True),
        ]
        
        logging.basicConfig(
            format="%(message)s",
            stream=sys.stdout,
            level=logging.DEBUG,
        )
    
    # Configure structlog
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, settings.observability.log_level.upper())
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )
    
    # Reduce noise from third-party libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("aiokafka").setLevel(logging.WARNING)
    logging.getLogger("asyncpg").setLevel(logging.WARNING)


def get_logger(name: str) -> structlog.BoundLogger:
    """Get a logger instance with the given name"""
    return structlog.get_logger(name)


class RequestLogger:
    """Context manager for request-scoped logging"""
    
    def __init__(self, request_id: str, **context: Any):
        self.request_id = request_id
        self.context = context
        self.logger = structlog.get_logger()
    
    def __enter__(self) -> structlog.BoundLogger:
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=self.request_id,
            **self.context
        )
        return self.logger
    
    def __exit__(self, *args: Any) -> None:
        structlog.contextvars.clear_contextvars()

