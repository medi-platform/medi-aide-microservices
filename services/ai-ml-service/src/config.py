"""
Enterprise Configuration Module
Handles all environment-based configuration with validation and defaults
"""

from functools import lru_cache
from typing import Optional, List
from pydantic import Field, field_validator, PostgresDsn, RedisDsn
from pydantic_settings import BaseSettings, SettingsConfigDict
import os


class DatabaseSettings(BaseSettings):
    """Database configuration"""
    
    model_config = SettingsConfigDict(env_prefix="DB_")
    
    host: str = Field(default="localhost", description="Database host")
    port: int = Field(default=5432, description="Database port")
    user: str = Field(default="service_user", description="Database user")
    password: str = Field(default="service123", description="Database password")
    name: str = Field(default="ai_db", description="Database name")
    pool_size: int = Field(default=20, description="Connection pool size")
    max_overflow: int = Field(default=10, description="Max overflow connections")
    pool_timeout: int = Field(default=30, description="Pool timeout in seconds")
    echo: bool = Field(default=False, description="Echo SQL statements")
    
    @property
    def url(self) -> str:
        return f"postgresql+asyncpg://{self.user}:{self.password}@{self.host}:{self.port}/{self.name}"
    
    @property
    def sync_url(self) -> str:
        return f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.name}"


class RedisSettings(BaseSettings):
    """Redis configuration"""
    
    model_config = SettingsConfigDict(env_prefix="REDIS_")
    
    host: str = Field(default="localhost", description="Redis host")
    port: int = Field(default=6379, description="Redis port")
    password: Optional[str] = Field(default=None, description="Redis password")
    db: int = Field(default=0, description="Redis database number")
    max_connections: int = Field(default=50, description="Max connections")
    decode_responses: bool = Field(default=True, description="Decode responses")
    
    # Cache TTL settings (in seconds)
    default_ttl: int = Field(default=3600, description="Default cache TTL")
    prediction_ttl: int = Field(default=900, description="Prediction cache TTL (15 min)")
    model_ttl: int = Field(default=86400, description="Model cache TTL (24 hours)")
    
    @property
    def url(self) -> str:
        if self.password:
            return f"redis://:{self.password}@{self.host}:{self.port}/{self.db}"
        return f"redis://{self.host}:{self.port}/{self.db}"


class KafkaSettings(BaseSettings):
    """Kafka configuration"""
    
    model_config = SettingsConfigDict(env_prefix="KAFKA_")
    
    brokers: str = Field(default="localhost:9092", description="Kafka brokers")
    group_id: str = Field(default="ai-ml-service", description="Consumer group ID")
    auto_offset_reset: str = Field(default="earliest", description="Offset reset policy")
    enable_auto_commit: bool = Field(default=True, description="Enable auto commit")
    session_timeout_ms: int = Field(default=30000, description="Session timeout")
    heartbeat_interval_ms: int = Field(default=10000, description="Heartbeat interval")
    
    # Topics
    matching_topic: str = Field(default="ai.matching.requests", description="Matching requests topic")
    recommendations_topic: str = Field(default="ai.recommendations.requests", description="Recommendations topic")
    predictions_topic: str = Field(default="ai.predictions.requests", description="Predictions topic")
    results_topic: str = Field(default="ai.results", description="Results topic")
    
    @property
    def broker_list(self) -> List[str]:
        return [b.strip() for b in self.brokers.split(",")]


class ObservabilitySettings(BaseSettings):
    """Observability and monitoring configuration"""
    
    model_config = SettingsConfigDict(env_prefix="")
    
    # Jaeger tracing
    jaeger_endpoint: str = Field(
        default="http://localhost:14268/api/traces",
        alias="JAEGER_ENDPOINT",
        description="Jaeger collector endpoint"
    )
    jaeger_agent_host: str = Field(
        default="localhost",
        alias="JAEGER_AGENT_HOST",
        description="Jaeger agent host"
    )
    jaeger_agent_port: int = Field(
        default=6831,
        alias="JAEGER_AGENT_PORT",
        description="Jaeger agent port"
    )
    
    # Prometheus
    metrics_enabled: bool = Field(default=True, alias="METRICS_ENABLED")
    metrics_path: str = Field(default="/metrics", alias="METRICS_PATH")
    
    # Logging
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    log_format: str = Field(default="json", alias="LOG_FORMAT")
    log_file: Optional[str] = Field(default=None, alias="LOG_FILE")


class ConsulSettings(BaseSettings):
    """Consul service discovery configuration"""
    
    model_config = SettingsConfigDict(env_prefix="CONSUL_")
    
    host: str = Field(default="localhost", description="Consul host")
    port: int = Field(default=8500, description="Consul port")
    enabled: bool = Field(default=True, description="Enable Consul registration")
    service_name: str = Field(default="ai-ml-service", description="Service name")
    health_check_interval: str = Field(default="10s", description="Health check interval")
    deregister_critical_after: str = Field(default="1m", description="Deregister after critical")
    
    @property
    def url(self) -> str:
        return f"http://{self.host}:{self.port}"


class AIModelSettings(BaseSettings):
    """AI/ML model configuration"""
    
    model_config = SettingsConfigDict(env_prefix="AI_")
    
    # Model paths
    models_dir: str = Field(default="/app/models", description="Models directory")
    
    # Matching engine settings
    matching_min_score: float = Field(default=0.3, description="Minimum match score")
    matching_max_results: int = Field(default=20, description="Max matching results")
    
    # Recommendation engine settings
    recommendations_max: int = Field(default=10, description="Max recommendations")
    recommendations_diversity: float = Field(default=0.3, description="Diversity factor")
    
    # Text analysis settings
    sentiment_threshold: float = Field(default=0.6, description="Sentiment confidence threshold")
    moderation_threshold: float = Field(default=0.8, description="Moderation threshold")
    
    # Burnout prediction settings
    burnout_high_risk_threshold: float = Field(default=0.7, description="High risk threshold")
    burnout_check_interval_hours: int = Field(default=24, description="Check interval")
    
    # Schedule optimization settings
    schedule_max_travel_minutes: int = Field(default=45, description="Max travel time")
    schedule_buffer_minutes: int = Field(default=15, description="Buffer between visits")
    
    # Feature flags
    enable_cultural_matching: bool = Field(default=True, description="Enable cultural matching")
    enable_advanced_nlp: bool = Field(default=True, description="Enable advanced NLP")
    enable_explainability: bool = Field(default=True, description="Enable AI explainability")


class Settings(BaseSettings):
    """Main application settings"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Application settings
    app_name: str = Field(default="Medi-Aide AI/ML Service", alias="APP_NAME")
    app_version: str = Field(default="1.0.0", alias="APP_VERSION")
    environment: str = Field(default="development", alias="ENVIRONMENT")
    debug: bool = Field(default=False, alias="DEBUG")
    
    # Server settings
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8005, alias="PORT")
    workers: int = Field(default=4, alias="WORKERS")
    
    # Security
    api_key: Optional[str] = Field(default=None, alias="API_KEY")
    cors_origins: str = Field(default="*", alias="CORS_ORIGINS")
    
    # Sub-configurations
    database: DatabaseSettings = Field(default_factory=DatabaseSettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)
    kafka: KafkaSettings = Field(default_factory=KafkaSettings)
    observability: ObservabilitySettings = Field(default_factory=ObservabilitySettings)
    consul: ConsulSettings = Field(default_factory=ConsulSettings)
    ai: AIModelSettings = Field(default_factory=AIModelSettings)
    
    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"
    
    @property
    def is_development(self) -> bool:
        return self.environment.lower() == "development"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Convenience exports
settings = get_settings()

