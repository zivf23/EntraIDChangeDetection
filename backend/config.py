# backend/config.py
import os
import sys

# The fixed path inside the image where secrets are placed
SECRET_PATH_IN_IMAGE = '/app/secrets'

def get_secret(secret_name):
    """Read a secret value from the mounted secrets directory in the container."""
    secret_path = os.path.join(SECRET_PATH_IN_IMAGE, secret_name)
    try:
        with open(secret_path, 'r') as secret_file:
            return secret_file.read().strip()
    except IOError:
        print(f"!!! FATAL ERROR: Secret '{secret_name}' not found at {secret_path}. Build process may have failed.", file=sys.stderr)
        sys.exit(1)

# Load sensitive credentials from files
GRAPH_CLIENT_ID = get_secret('graph_client_id')
GRAPH_TENANT_ID = get_secret('graph_tenant_id')
GRAPH_CLIENT_SECRET = get_secret('graph_client_secret')
OPENAI_API_KEY = get_secret('openai_api_key')

# Load non-sensitive config from environment (populated via .env)
GRAPH_SCOPE = os.environ.get("GRAPH_SCOPE", "https://graph.microsoft.com/.default")
GRAPH_CONFIG_ENDPOINT = os.environ.get("GRAPH_CONFIG_ENDPOINT", "https://graph.microsoft.com/v1.0")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-3.5-turbo")
# Default interval (in minutes) to check for changes, can be overridden by env
CHECK_INTERVAL_MINUTES = int(os.environ.get("CHECK_INTERVAL_MINUTES", "10"))

print("--- Configuration and Secrets Loaded Successfully! ---")
