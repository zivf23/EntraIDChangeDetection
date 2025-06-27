# backend/Dockerfile (Final Corrected Version for Python)
#syntax=docker/dockerfile:1.4

# --- שלב 1: התקנת תלויות ---
FROM python:3.11-slim as dependencies
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- שלב 2: בניית האימג' הסופי ---
FROM python:3.11-slim
WORKDIR /app

# ⭐️ התיקון הקריטי: העתקת גם הספריות וגם קבצי ההרצה מהשלב הקודם ⭐️
COPY --from=dependencies /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=dependencies /usr/local/bin /usr/local/bin

# העתקת קוד המקור של האפליקציה
COPY . .

# הזרקת סודות בזמן ה-build (זה נשאר כפי שהיה)
RUN --mount=type=secret,id=graph_client_id,dst=/tmp/graph_client_id \
    --mount=type=secret,id=graph_tenant_id,dst=/tmp/graph_tenant_id \
    --mount=type=secret,id=graph_client_secret,dst=/tmp/graph_client_secret \
    --mount=type=secret,id=openai_api_key,dst=/tmp/openai_api_key \
    mkdir -p /app/secrets && \
    cp /tmp/graph_client_id /app/secrets/graph_client_id && \
    cp /tmp/graph_tenant_id /app/secrets/graph_tenant_id && \
    cp /tmp/graph_client_secret /app/secrets/graph_client_secret && \
    cp /tmp/openai_api_key /app/secrets/openai_api_key

# פקודת ההרצה
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "1", "--reload", "--log-level=debug", "app:app"]