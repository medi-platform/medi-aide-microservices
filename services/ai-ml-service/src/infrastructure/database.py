"""
Database Connection Management
Async PostgreSQL connection pool with SQLAlchemy
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional

import structlog
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    AsyncEngine,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from src.config import settings

logger = structlog.get_logger(__name__)

# Global engine and session factory
_engine: Optional[AsyncEngine] = None
_session_factory: Optional[async_sessionmaker[AsyncSession]] = None


class Base(DeclarativeBase):
    """Base class for SQLAlchemy models"""
    pass


async def init_database() -> None:
    """Initialize database connection pool"""
    global _engine, _session_factory
    
    try:
        # Create async engine
        _engine = create_async_engine(
            settings.database.url,
            echo=settings.database.echo,
            pool_size=settings.database.pool_size,
            max_overflow=settings.database.max_overflow,
            pool_timeout=settings.database.pool_timeout,
            pool_pre_ping=True,  # Verify connections before use
            pool_recycle=3600,   # Recycle connections after 1 hour
        )
        
        # Create session factory
        _session_factory = async_sessionmaker(
            bind=_engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
            autocommit=False,
        )
        
        # Test connection
        async with _engine.begin() as conn:
            await conn.run_sync(lambda _: None)
        
        logger.info(
            "Database initialized",
            host=settings.database.host,
            database=settings.database.name,
            pool_size=settings.database.pool_size
        )
        
    except Exception as e:
        logger.warning("Failed to initialize database - service will run in degraded mode", error=str(e))
        # Don't raise - allow service to start in degraded mode
        _engine = None
        _session_factory = None


async def close_database() -> None:
    """Close database connection pool"""
    global _engine, _session_factory
    
    if _engine:
        await _engine.dispose()
        _engine = None
        _session_factory = None
        logger.info("Database connection pool closed")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for getting database sessions
    Usage: db: AsyncSession = Depends(get_db)
    """
    if _session_factory is None:
        raise RuntimeError("Database not initialized. Call init_database() first.")
    
    async with _session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def get_db_context() -> AsyncGenerator[AsyncSession, None]:
    """
    Context manager for database sessions
    Usage: async with get_db_context() as db:
    """
    if _session_factory is None:
        raise RuntimeError("Database not initialized. Call init_database() first.")
    
    async with _session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def check_database_health() -> dict:
    """Check database connectivity for health checks"""
    try:
        if _engine is None:
            return {"status": "unhealthy", "error": "Not initialized"}
        
        async with _engine.begin() as conn:
            result = await conn.execute("SELECT 1")
            result.fetchone()
        
        return {"status": "healthy"}
    
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

