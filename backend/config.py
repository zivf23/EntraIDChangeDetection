# backend/config.py
import os
import sys

SECRET_PATH_IN_IMAGE = '/app/secrets'

def get_secret(secret_name):
    secret_path = os.path.join(SECRET_PATH_IN_IMAGE, secret_name)
    try:
        with open(secret_path, 'r') as secret_file:
            return secret_file.read().strip()
    except IOError:
        print(f"!!! FATAL ERROR: Secret '{secret_name}' not found at {secret_path}. Build process may have failed.", file=sys.stderr)
        return None # Return None to be checked later

# Load secrets
GRAPH_CLIENT_ID = get_secret('graph_client_id')
GRAPH_TENANT_ID = get_secret('graph_tenant_id')
GRAPH_CLIENT_SECRET = get_secret('graph_client_secret')
OPENAI_API_KEY = get_secret('openai_api_key')

# Load non-secrets from .env file
GRAPH_SCOPE = os.environ.get("GRAPH_SCOPE")
GRAPH_CONFIG_ENDPOINT = os.environ.get("GRAPH_CONFIG_ENDPOINT")

# Central validation function
def validate_config():
    required_vars = {
        'GRAPH_CLIENT_ID': GRAPH_CLIENT_ID,
        'GRAPH_TENANT_ID': GRAPH_TENANT_ID,
        'GRAPH_CLIENT_SECRET': GRAPH_CLIENT_SECRET,
        'OPENAI_API_KEY': OPENAI_API_KEY,
        'GRAPH_SCOPE': GRAPH_SCOPE,
        'GRAPH_CONFIG_ENDPOINT': GRAPH_CONFIG_ENDPOINT
    }
    
    missing_vars = [name for name, value in required_vars.items() if not value]
    
    if missing_vars:
        print(f"!!! FATAL ERROR: Missing required configuration: {missing_vars}")
        sys.exit(1)
    
    print("--- Configuration and Secrets loaded successfully! ---")