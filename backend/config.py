# backend/config.py
import os
import sys

# הנתיב החדש והקבוע שבו הסודות נמצאים בתוך האימג'
SECRET_PATH_IN_IMAGE = '/app/secrets'

def get_secret(secret_name):
    secret_path = os.path.join(SECRET_PATH_IN_IMAGE, secret_name)
    try:
        with open(secret_path, 'r') as secret_file:
            return secret_file.read().strip()
    except IOError:
        print(f"!!! FATAL ERROR: Secret '{secret_name}' not found at {secret_path}. Build process may have failed.", file=sys.stderr)
        sys.exit(1)

# קריאת הסודות
GRAPH_CLIENT_ID = get_secret('graph_client_id')
GRAPH_TENANT_ID = get_secret('graph_tenant_id')
GRAPH_CLIENT_SECRET = get_secret('graph_client_secret')
OPENAI_API_KEY = get_secret('openai_api_key')

# קריאת התצורה מה-.env
GRAPH_SCOPE = os.environ.get("GRAPH_SCOPE")
GRAPH_CONFIG_ENDPOINT = os.environ.get("GRAPH_CONFIG_ENDPOINT")