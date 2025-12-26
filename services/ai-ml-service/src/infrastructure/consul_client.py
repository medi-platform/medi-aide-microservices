"""
Consul Service Discovery Integration
Service registration and health check management
"""

import socket
from typing import Optional

import httpx
import structlog

from src.config import settings

logger = structlog.get_logger(__name__)

# Service registration ID
_service_id: Optional[str] = None


def _get_host_ip() -> str:
    """Get the host IP address for service registration"""
    try:
        # Get the IP address that would be used to connect to Consul
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect((settings.consul.host, settings.consul.port))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


async def register_service() -> None:
    """Register service with Consul"""
    global _service_id
    
    if not settings.consul.enabled:
        logger.info("Consul registration disabled")
        return
    
    host_ip = _get_host_ip()
    _service_id = f"{settings.consul.service_name}-{host_ip}-{settings.port}"
    
    registration = {
        "ID": _service_id,
        "Name": settings.consul.service_name,
        "Address": host_ip,
        "Port": settings.port,
        "Tags": [
            "ai-ml",
            "fastapi",
            f"version-{settings.app_version}",
            settings.environment
        ],
        "Meta": {
            "version": settings.app_version,
            "environment": settings.environment,
            "protocol": "http"
        },
        "Check": {
            "HTTP": f"http://{host_ip}:{settings.port}/health/live",
            "Method": "GET",
            "Interval": settings.consul.health_check_interval,
            "Timeout": "5s",
            "DeregisterCriticalServiceAfter": settings.consul.deregister_critical_after
        }
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{settings.consul.url}/v1/agent/service/register",
                json=registration,
                timeout=10.0
            )
            
            if response.status_code == 200:
                logger.info(
                    "Service registered with Consul",
                    service_id=_service_id,
                    address=f"{host_ip}:{settings.port}"
                )
            else:
                logger.error(
                    "Failed to register with Consul",
                    status_code=response.status_code,
                    response=response.text
                )
                
    except Exception as e:
        logger.error("Consul registration error", error=str(e))


async def deregister_service() -> None:
    """Deregister service from Consul"""
    global _service_id
    
    if not settings.consul.enabled or not _service_id:
        return
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{settings.consul.url}/v1/agent/service/deregister/{_service_id}",
                timeout=10.0
            )
            
            if response.status_code == 200:
                logger.info("Service deregistered from Consul", service_id=_service_id)
            else:
                logger.warning(
                    "Failed to deregister from Consul",
                    status_code=response.status_code
                )
                
    except Exception as e:
        logger.error("Consul deregistration error", error=str(e))
    
    _service_id = None


async def get_service_instances(service_name: str) -> list:
    """Get healthy instances of a service from Consul"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.consul.url}/v1/health/service/{service_name}",
                params={"passing": "true"},
                timeout=10.0
            )
            
            if response.status_code == 200:
                services = response.json()
                return [
                    {
                        "id": svc["Service"]["ID"],
                        "address": svc["Service"]["Address"],
                        "port": svc["Service"]["Port"],
                        "tags": svc["Service"]["Tags"],
                        "meta": svc["Service"]["Meta"]
                    }
                    for svc in services
                ]
            
            return []
            
    except Exception as e:
        logger.error("Failed to get service instances", service=service_name, error=str(e))
        return []


async def check_consul_health() -> dict:
    """Check Consul connectivity for health checks"""
    if not settings.consul.enabled:
        return {"status": "disabled"}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.consul.url}/v1/status/leader",
                timeout=5.0
            )
            
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "leader": response.json(),
                    "service_id": _service_id
                }
            
            return {"status": "unhealthy", "error": f"Status {response.status_code}"}
            
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

