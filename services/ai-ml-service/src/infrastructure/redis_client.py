"""
Redis Client for Caching and Session Management
Enterprise-grade Redis integration with connection pooling
"""

import json
from typing import Any, Optional, Union
from datetime import timedelta

import structlog
import redis.asyncio as redis
from redis.asyncio.connection import ConnectionPool

from src.config import settings

logger = structlog.get_logger(__name__)

# Global Redis client
_redis_client: Optional[redis.Redis] = None
_connection_pool: Optional[ConnectionPool] = None


async def init_redis() -> None:
    """Initialize Redis connection pool"""
    global _redis_client, _connection_pool
    
    try:
        # Create connection pool
        _connection_pool = ConnectionPool.from_url(
            settings.redis.url,
            max_connections=settings.redis.max_connections,
            decode_responses=settings.redis.decode_responses,
        )
        
        # Create Redis client
        _redis_client = redis.Redis(connection_pool=_connection_pool)
        
        # Test connection
        await _redis_client.ping()
        
        logger.info(
            "Redis initialized",
            host=settings.redis.host,
            port=settings.redis.port,
            max_connections=settings.redis.max_connections
        )
        
    except Exception as e:
        logger.error("Failed to initialize Redis", error=str(e))
        # Don't raise - Redis failure shouldn't prevent service startup
        _redis_client = None


async def close_redis() -> None:
    """Close Redis connections"""
    global _redis_client, _connection_pool
    
    if _redis_client:
        await _redis_client.close()
        _redis_client = None
    
    if _connection_pool:
        await _connection_pool.disconnect()
        _connection_pool = None
    
    logger.info("Redis connections closed")


def get_redis() -> Optional[redis.Redis]:
    """Get Redis client instance"""
    return _redis_client


class CacheManager:
    """High-level caching interface"""
    
    def __init__(self, prefix: str = "ai_ml"):
        self.prefix = prefix
        self.default_ttl = settings.redis.default_ttl
    
    def _make_key(self, key: str) -> str:
        """Create prefixed cache key"""
        return f"{self.prefix}:{key}"
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not _redis_client:
            return None
        
        try:
            value = await _redis_client.get(self._make_key(key))
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.warning("Cache get failed", key=key, error=str(e))
            return None
    
    async def set(
        self, 
        key: str, 
        value: Any, 
        ttl: Optional[int] = None
    ) -> bool:
        """Set value in cache with TTL"""
        if not _redis_client:
            return False
        
        try:
            await _redis_client.set(
                self._make_key(key),
                json.dumps(value, default=str),
                ex=ttl or self.default_ttl
            )
            return True
        except Exception as e:
            logger.warning("Cache set failed", key=key, error=str(e))
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete value from cache"""
        if not _redis_client:
            return False
        
        try:
            await _redis_client.delete(self._make_key(key))
            return True
        except Exception as e:
            logger.warning("Cache delete failed", key=key, error=str(e))
            return False
    
    async def get_or_set(
        self,
        key: str,
        factory: callable,
        ttl: Optional[int] = None
    ) -> Any:
        """Get from cache or compute and cache"""
        value = await self.get(key)
        if value is not None:
            return value
        
        # Compute value
        if asyncio.iscoroutinefunction(factory):
            value = await factory()
        else:
            value = factory()
        
        # Cache it
        await self.set(key, value, ttl)
        return value


# Specialized cache managers
prediction_cache = CacheManager(prefix="ai_ml:prediction")
model_cache = CacheManager(prefix="ai_ml:model")
recommendation_cache = CacheManager(prefix="ai_ml:recommendation")
matching_cache = CacheManager(prefix="ai_ml:matching")


async def check_redis_health() -> dict:
    """Check Redis connectivity for health checks"""
    try:
        if _redis_client is None:
            return {"status": "degraded", "error": "Not initialized"}
        
        await _redis_client.ping()
        info = await _redis_client.info("server")
        
        return {
            "status": "healthy",
            "version": info.get("redis_version", "unknown"),
            "connected_clients": info.get("connected_clients", 0)
        }
    
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


# Import for async operations
import asyncio

