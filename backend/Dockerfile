# backend/Dockerfile
# ===================================================================
# STAGE 1: The "Builder" Stage
# ===================================================================
FROM python:3.11-slim as builder

WORKDIR /app

# Install dependencies into a specific, non-user directory
# This prevents them from being overwritten by the volume mount.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt -t /app/deps

# Copy the rest of the application source code
COPY . .


# ===================================================================
# STAGE 2: The "Final" Stage
# ===================================================================
FROM python:3.11-slim

WORKDIR /app

# Create a non-root user
RUN addgroup --system app && adduser --system --group app

# --- FIX: Copy dependencies to a location that won't be overwritten by volumes ---
COPY --from=builder /app/deps /app/deps
COPY --from=builder /app /app

RUN chown -R app:app /app

USER app

# --- FIX: Add the dependencies directory to PYTHONPATH ---
# This tells Python where to find the installed packages.
ENV PYTHONPATH="/app:/app/deps"
ENV DOCKER_CONTAINER=1

EXPOSE 5000

# The command will be provided by docker-compose, so no CMD is needed here.
