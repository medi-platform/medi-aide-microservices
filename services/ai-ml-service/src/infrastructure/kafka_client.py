"""
Kafka Client for Event-Driven AI Processing
Async Kafka producer and consumer management
"""

import asyncio
import json
from typing import Any, Callable, Dict, List, Optional
from dataclasses import dataclass

import structlog
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from aiokafka.errors import KafkaError

from src.config import settings

logger = structlog.get_logger(__name__)

# Global Kafka clients
_producer: Optional[AIOKafkaProducer] = None
_consumers: Dict[str, AIOKafkaConsumer] = {}
_consumer_tasks: List[asyncio.Task] = []


@dataclass
class KafkaMessage:
    """Structured Kafka message"""
    topic: str
    key: Optional[str]
    value: Dict[str, Any]
    headers: Optional[Dict[str, str]] = None
    timestamp: Optional[int] = None


async def init_kafka() -> None:
    """Initialize Kafka producer and consumers"""
    global _producer
    
    try:
        # Initialize producer
        _producer = AIOKafkaProducer(
            bootstrap_servers=settings.kafka.broker_list,
            value_serializer=lambda v: json.dumps(v, default=str).encode("utf-8"),
            key_serializer=lambda k: k.encode("utf-8") if k else None,
            acks="all",
            enable_idempotence=True,
            max_batch_size=16384,
            linger_ms=10,
        )
        await _producer.start()
        
        logger.info(
            "Kafka producer initialized",
            brokers=settings.kafka.brokers
        )
        
        # Start consumers for AI topics
        await _start_consumers()
        
    except Exception as e:
        logger.error("Failed to initialize Kafka", error=str(e))
        # Don't raise - Kafka failure shouldn't prevent service startup


async def _start_consumers() -> None:
    """Start Kafka consumers for AI processing topics"""
    topics = [
        settings.kafka.matching_topic,
        settings.kafka.recommendations_topic,
        settings.kafka.predictions_topic,
    ]
    
    for topic in topics:
        try:
            consumer = AIOKafkaConsumer(
                topic,
                bootstrap_servers=settings.kafka.broker_list,
                group_id=f"{settings.kafka.group_id}-{topic}",
                auto_offset_reset=settings.kafka.auto_offset_reset,
                enable_auto_commit=settings.kafka.enable_auto_commit,
                value_deserializer=lambda m: json.loads(m.decode("utf-8")),
                session_timeout_ms=settings.kafka.session_timeout_ms,
                heartbeat_interval_ms=settings.kafka.heartbeat_interval_ms,
            )
            await consumer.start()
            _consumers[topic] = consumer
            
            # Start consumer task
            task = asyncio.create_task(_consume_messages(topic, consumer))
            _consumer_tasks.append(task)
            
            logger.info("Kafka consumer started", topic=topic)
            
        except Exception as e:
            logger.error("Failed to start consumer", topic=topic, error=str(e))


async def _consume_messages(topic: str, consumer: AIOKafkaConsumer) -> None:
    """Consume and process messages from a topic"""
    try:
        async for msg in consumer:
            try:
                await _process_message(
                    KafkaMessage(
                        topic=msg.topic,
                        key=msg.key.decode("utf-8") if msg.key else None,
                        value=msg.value,
                        timestamp=msg.timestamp
                    )
                )
            except Exception as e:
                logger.error(
                    "Error processing message",
                    topic=topic,
                    error=str(e)
                )
    except asyncio.CancelledError:
        logger.info("Consumer cancelled", topic=topic)
    except Exception as e:
        logger.error("Consumer error", topic=topic, error=str(e))


async def _process_message(message: KafkaMessage) -> None:
    """Process incoming Kafka message"""
    logger.debug(
        "Processing message",
        topic=message.topic,
        key=message.key
    )
    
    # Route to appropriate handler based on topic
    if message.topic == settings.kafka.matching_topic:
        from src.services.matching.engine import process_matching_request
        result = await process_matching_request(message.value)
        await publish_result(message.key, result, "matching")
        
    elif message.topic == settings.kafka.recommendations_topic:
        from src.services.recommendations.engine import process_recommendation_request
        result = await process_recommendation_request(message.value)
        await publish_result(message.key, result, "recommendations")
        
    elif message.topic == settings.kafka.predictions_topic:
        from src.services.predictive.engine import process_prediction_request
        result = await process_prediction_request(message.value)
        await publish_result(message.key, result, "predictions")


async def publish_result(
    correlation_id: Optional[str],
    result: Dict[str, Any],
    result_type: str
) -> None:
    """Publish processing result to results topic"""
    if _producer:
        try:
            await _producer.send_and_wait(
                settings.kafka.results_topic,
                key=correlation_id,
                value={
                    "type": result_type,
                    "correlation_id": correlation_id,
                    "result": result
                }
            )
        except Exception as e:
            logger.error("Failed to publish result", error=str(e))


async def publish_event(
    topic: str,
    key: Optional[str],
    value: Dict[str, Any],
    headers: Optional[Dict[str, str]] = None
) -> bool:
    """Publish event to Kafka topic"""
    if not _producer:
        logger.warning("Kafka producer not available")
        return False
    
    try:
        kafka_headers = [(k, v.encode()) for k, v in (headers or {}).items()]
        
        await _producer.send_and_wait(
            topic,
            key=key,
            value=value,
            headers=kafka_headers if kafka_headers else None
        )
        
        logger.debug("Event published", topic=topic, key=key)
        return True
        
    except Exception as e:
        logger.error("Failed to publish event", topic=topic, error=str(e))
        return False


async def close_kafka() -> None:
    """Close Kafka connections"""
    global _producer, _consumers, _consumer_tasks
    
    # Cancel consumer tasks
    for task in _consumer_tasks:
        task.cancel()
    
    if _consumer_tasks:
        await asyncio.gather(*_consumer_tasks, return_exceptions=True)
    _consumer_tasks = []
    
    # Stop consumers
    for topic, consumer in _consumers.items():
        try:
            await consumer.stop()
            logger.debug("Consumer stopped", topic=topic)
        except Exception as e:
            logger.error("Error stopping consumer", topic=topic, error=str(e))
    _consumers = {}
    
    # Stop producer
    if _producer:
        await _producer.stop()
        _producer = None
    
    logger.info("Kafka connections closed")


async def check_kafka_health() -> dict:
    """Check Kafka connectivity for health checks"""
    try:
        if _producer is None:
            return {"status": "degraded", "error": "Producer not initialized"}
        
        # Simple health check - verify producer is running
        return {
            "status": "healthy",
            "brokers": settings.kafka.brokers,
            "active_consumers": len(_consumers)
        }
    
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

