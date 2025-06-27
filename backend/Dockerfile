# backend/Dockerfile
# syntax=docker/dockerfile:1.4

# Stage 1: Install Python dependencies
FROM python:3.11-slim AS dependencies
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Build the final image
FROM python:3.11-slim
WORKDIR /app

# Copy installed dependencies from the builder stage
COPY --from=dependencies /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=dependencies /usr/local/bin /usr/local/bin

# Copy the application source code into /app
COPY . . 

# Ensure the working directory is in Python path for module resolution
ENV PYTHONPATH="/app:${PYTHONPATH}"

# Inject secrets at build time and place them in /app/secrets
RUN --mount=type=secret,id=graph_client_id,dst=/tmp/graph_client_id \
    --mount=type=secret,id=graph_tenant_id,dst=/tmp/graph_tenant_id \
    --mount=type=secret,id=graph_client_secret,dst=/tmp/graph_client_secret \
    --mount=type=secret,id=openai_api_key,dst=/tmp/openai_api_key \
    mkdir -p /app/secrets && \
    cp /tmp/graph_client_id /app/secrets/graph_client_id && \
    cp /tmp/graph_tenant_id /app/secrets/graph_tenant_id && \
    cp /tmp/graph_client_secret /app/secrets/graph_client_secret && \
    cp /tmp/openai_api_key /app/secrets/openai_api_key

# Launch the Flask app with Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "1", "--reload", "--log-level=debug", "app:app"]
