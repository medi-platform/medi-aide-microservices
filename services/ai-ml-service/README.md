# Medi-Aide AI/ML Service

Enterprise-grade AI microservice for the Medi-Aide Healthcare Platform.

## Overview

This service provides AI/ML capabilities including:

- **Matching Engine**: Caregiver-patient matching with cultural alignment
- **Recommendations**: Wellness, training, and care plan recommendations
- **Text Analysis**: Sentiment analysis, moderation, and NLP
- **Conversational AI**: Chat support and wellness chatbot
- **Schedule Optimization**: Route and shift optimization
- **Wellness AI**: Burnout prediction and intervention suggestions
- **Care Plan Assistant**: AI-powered care plan generation
- **Compliance Prediction**: Risk assessment and compliance scoring
- **Explainability**: AI decision explanations for transparency
- **Predictive Analytics**: Demand forecasting and risk prediction

## Technology Stack

- **Framework**: FastAPI 0.109+
- **Python**: 3.11+
- **ML Libraries**: NumPy, Pandas, Scikit-learn, XGBoost
- **Database**: PostgreSQL with asyncpg
- **Caching**: Redis with aioredis
- **Messaging**: Kafka with aiokafka
- **Tracing**: OpenTelemetry with Jaeger
- **Metrics**: Prometheus

## Quick Start

### Prerequisites

- Python 3.11+
- Docker & Docker Compose
- PostgreSQL (or Docker container)
- Redis (or Docker container)

### Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run in development mode
uvicorn src.main:app --reload --port 8005
```

### Docker

```bash
# Build image
docker build -t medi-aide-ai-ml-service .

# Run container
docker run -p 8005:8005 --env-file .env medi-aide-ai-ml-service

# If you're running the legacy monolith on the same machine (it also uses host :8005),
# publish the container on an alternate host port (container still listens on 8005):
docker run -p 18005:8005 --env-file .env medi-aide-ai-ml-service
```

### With Docker Compose (Full Stack)

```bash
# From monorepo root
docker compose -f docker-compose.services-v2.yml up ai-ml-service
```

## API Endpoints

### Health Checks

| Endpoint | Description |
|----------|-------------|
| `GET /health/live` | Kubernetes liveness probe |
| `GET /health/ready` | Kubernetes readiness probe |
| `GET /health/detailed` | Detailed health status |

### AI Capabilities

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/matching/find` | Find caregiver-patient matches |
| `POST /api/v1/recommendations/generate` | Generate recommendations |
| `POST /api/v1/text-analysis/analyze` | Analyze text (sentiment, moderation) |
| `POST /api/v1/chat/message` | Chat with AI assistant |
| `POST /api/v1/schedule/optimize` | Optimize schedules |
| `POST /api/v1/wellness/burnout/predict` | Predict burnout risk |
| `POST /api/v1/care-plans/generate` | Generate care plans |
| `POST /api/v1/compliance/assess` | Assess compliance |
| `POST /api/v1/explainability/explain` | Explain AI decisions |
| `POST /api/v1/predictive/predict` | Make predictions |

### Documentation

- **Swagger UI**: http://localhost:8005/docs (development only)
- **ReDoc**: http://localhost:8005/redoc (development only)
- **OpenAPI JSON**: http://localhost:8005/openapi.json
+
If you published the container on an alternate host port (e.g. `18005:8005`), use:
- **Swagger UI**: http://localhost:18005/docs

## Configuration

Configuration is managed via environment variables. See `.env.example` for all options.

### Key Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8005 | Service port |
| `WORKERS` | 4 | Uvicorn workers |
| `DB_HOST` | localhost | PostgreSQL host |
| `REDIS_HOST` | localhost | Redis host |
| `KAFKA_BROKERS` | localhost:9092 | Kafka brokers |
| `AI_MATCHING_MIN_SCORE` | 0.3 | Minimum match score |
| `AI_ENABLE_EXPLAINABILITY` | true | Enable AI explanations |

## Architecture

```
src/
├── main.py              # FastAPI application
├── config.py            # Configuration management
├── api/                 # API routes
│   ├── health.py
│   ├── matching.py
│   ├── recommendations.py
│   └── ...
├── services/            # Business logic
│   ├── matching/
│   ├── recommendations/
│   └── ...
└── infrastructure/      # External integrations
    ├── database.py
    ├── redis_client.py
    ├── kafka_client.py
    └── ...
```

## Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=src --cov-report=html
```

## Monitoring

- **Metrics**: Available at `/metrics` (Prometheus format)
- **Tracing**: Distributed tracing via Jaeger
- **Logging**: Structured JSON logging (configurable)

## Performance

- **Latency**: < 100ms for most endpoints
- **Throughput**: 1000+ requests/second per worker
- **Memory**: ~500MB base, scales with model size

## Security

- Optional API key authentication
- Rate limiting (100 req/min standard, 10 req/min compute-heavy)
- Input validation via Pydantic
- Structured error responses

## License

Proprietary - Medi-Aide Platform

## Support

Contact: engineering@medi-aide.com

