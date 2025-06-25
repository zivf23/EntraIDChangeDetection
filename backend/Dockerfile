# backend/Dockerfile (Final Version with path fix)

#syntax=docker/dockerfile:1.4

# שלב 1: התקנת תלויות
FROM python:3.11-slim as dependencies
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# שלב 2: בניית האפליקציה הסופית
FROM python:3.11-slim
WORKDIR /app

# העתק את התלויות
COPY --from=dependencies /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=dependencies /usr/local/bin /usr/local/bin

# ⭐️ התיקון הקריטי: העתק את תוכן התיקייה הנוכחית (backend) לתוך /app/backend
# כך שהמבנה יהיה /app/backend/app.py, /app/backend/monitor.py וכו'
COPY . ./backend/

# ⭐️ הוספה חשובה: הוסף את ספריית העבודה לנתיב של פייתון
ENV PYTHONPATH "${PYTHONPATH}:/app"

# הזרקת סודות בזמן ה-build
RUN --mount=type=secret,id=graph_client_id,dst=/run/secrets/graph_client_id \
    --mount=type=secret,id=graph_tenant_id,dst=/run/secrets/graph_tenant_id \
    --mount=type=secret,id=graph_client_secret,dst=/run/secrets/graph_client_secret \
    --mount=type=secret,id=openai_api_key,dst=/run/secrets/openai_api_key \
    mkdir -p /app/secrets && \
    cp /run/secrets/* /app/secrets/

# פקודת ההרצה נשארת זהה, עכשיו פייתון ימצא את המודול "backend.app"
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "1", "--reload", "--log-level=debug", "backend.app:app"]