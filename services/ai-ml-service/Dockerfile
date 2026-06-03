# ==============================================================================
# Medi-Aide AI/ML Service - Enterprise Production Dockerfile
# Multi-stage build for optimized production deployment
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Base image with system dependencies
# ------------------------------------------------------------------------------
FROM python:3.11-slim as base

# Prevent Python from writing pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    libffi-dev \
    libssl-dev \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# ------------------------------------------------------------------------------
# Stage 2: Builder - Install Python dependencies
# ------------------------------------------------------------------------------
FROM base as builder

WORKDIR /app

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip setuptools wheel && \
    pip install -r requirements.txt

# ------------------------------------------------------------------------------
# Stage 3: Production image
# ------------------------------------------------------------------------------
FROM base as production

# Create non-root user for security
RUN groupadd -r mediaide && useradd -r -g mediaide mediaide

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code
COPY --chown=mediaide:mediaide src/ ./src/
COPY --chown=mediaide:mediaide pyproject.toml ./

# Create directories for logs and models
RUN mkdir -p /app/logs /app/models /app/data && \
    chown -R mediaide:mediaide /app

# Switch to non-root user
USER mediaide

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8005/health/live || exit 1

# Expose port
EXPOSE 8005

# Run with production-grade uvicorn settings
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8005", "--workers", "4", "--loop", "uvloop", "--http", "httptools", "--access-log", "--log-level", "info"]

# ------------------------------------------------------------------------------
# Stage 4: Development image (optional)
# ------------------------------------------------------------------------------
FROM production as development

USER root

# Install development dependencies
RUN pip install pytest pytest-asyncio pytest-cov black flake8 mypy httpx

USER mediaide

# Development mode with hot reload
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8005", "--reload", "--log-level", "debug"]

