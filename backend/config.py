# backend/config.py
import os
import sys

# ⭐️ התיקון: הנתיב החדש והקבוע שבו הסודות נמצאים בתוך האימג'
SECRET_PATH_IN_IMAGE = '/app/secrets'

def get_secret(secret_name):
    # הפונקציה קוראת מהנתיב הקבוע שהגדרנו ב-Dockerfile
    secret_path = os.path.join(SECRET_PATH_IN_IMAGE, secret_name)
    try:
        with open(secret_path, 'r') as secret_file:
            return secret_file.read().strip()
    except IOError:
        print(f"!!! FATAL ERROR: Secret '{secret_name}' not found at {secret_path}. Build process may have failed.", file=sys.stderr)
        sys.exit(1)

# קוראים את הסודות מהמקום החדש
GRAPH_CLIENT_ID = get_secret('graph_client_id')
GRAPH_TENANT_ID = get_secret('graph_tenant_id')
GRAPH_CLIENT_SECRET = get_secret('graph_client_secret')
OPENAI_API_KEY = get_secret('openai_api_key')

# קוראים את התצורה הלא-סודית ממשתני הסביבה שנטענו מה-.env
GRAPH_SCOPE = os.environ.get("GRAPH_SCOPE")
GRAPH_CONFIG_ENDPOINT = os.environ.get("GRAPH_CONFIG_ENDPOINT")

# OpenAI configuration
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-3.5-turbo")

# Monitoring configuration
CHECK_INTERVAL_MINUTES = int(os.environ.get("CHECK_INTERVAL_MINUTES", "5"))

print("--- Configuration and Secrets Loaded Successfully! ---")