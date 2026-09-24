# syntax=docker/dockerfile:1
FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PORT=8050

# Install runtime dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create unprivileged non-root user
RUN groupadd -g 10001 krsgroup && \
    useradd -u 10001 -g krsgroup -s /bin/bash -m krsuser

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and migrations
COPY . /app

# Ensure correct ownership of vault and logs directory
RUN mkdir -p /app/storage_vault /app/logs && \
    chown -R krsuser:krsgroup /app

# Switch to unprivileged user
USER krsuser

# Expose backend port
EXPOSE 8050

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8050/api/health || exit 1

# Production entrypoint
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8050"]
