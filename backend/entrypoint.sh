#!/bin/sh
set -e

echo "Running database migrations..."
alembic upgrade head

PORT=${PORT:-8000}

echo "Starting API server on port $PORT..."
if [ "$ENVIRONMENT" = "production" ]; then
  exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
else
  exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --reload
fi
