"""
Infrastructure modules for AI/ML Service
Database, caching, messaging, and observability
"""

from src.infrastructure.database import init_database, close_database, get_db
from src.infrastructure.redis_client import init_redis, close_redis, get_redis
from src.infrastructure.kafka_client import init_kafka, close_kafka
from src.infrastructure.consul_client import register_service, deregister_service

__all__ = [
    "init_database", "close_database", "get_db",
    "init_redis", "close_redis", "get_redis",
    "init_kafka", "close_kafka",
    "register_service", "deregister_service"
]

