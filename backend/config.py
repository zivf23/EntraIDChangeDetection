### backend/config.py (With Docker Secrets Support)
"""
Configuration module for EntraID Change Detection System.
Supports Docker secrets for secure credential management.
"""

import os
import sys
from pathlib import Path

# Detect execution environment
IS_DOCKER = os.path.exists('/.dockerenv') or os.environ.get('DOCKER_CONTAINER', False)

def _read_secret(name, required=True):
    """
    Read a secret value from Docker secrets or local files.
    
    Args:
        name: Secret name (e.g., 'graph_client_id')
        required: If True, exit if secret not found
        
    Returns:
        str: Secret value (stripped of whitespace)
    """
    # Docker secrets path
    docker_path = f'/run/secrets/{name}'
    
    # Local development path
    local_path = Path(__file__).parent.parent / 'secrets' / f'{name}.txt'
    
    # Try Docker secrets first (production)
    if os.path.exists(docker_path):
        try:
            with open(docker_path, 'r') as f:
                value = f.read().strip()
                if value:
                    return value
        except Exception as e:
            print(f"Error reading Docker secret {name}: {e}", file=sys.stderr)
    
    # Try local secrets (development)
    if local_path.exists():
        try:
            with open(local_path, 'r') as f:
                value = f.read().strip()
                if value:
                    return value
        except Exception as e:
            print(f"Error reading local secret {name}: {e}", file=sys.stderr)
    
    # Try environment variable as last resort
    env_value = os.environ.get(name.upper())
    if env_value:
        return env_value
    
    # Handle missing secret
    if required:
        print(f"\nERROR: Required secret '{name}' not found!", file=sys.stderr)
        print(f"Please create: secrets/{name}.txt", file=sys.stderr)
        sys.exit(1)
    
    return None

# Load required secrets
print("Loading secure configuration...")
GRAPH_CLIENT_ID = _read_secret('graph_client_id')
GRAPH_TENANT_ID = _read_secret('graph_tenant_id')
GRAPH_CLIENT_SECRET = _read_secret('graph_client_secret')
OPENAI_API_KEY = _read_secret('openai_api_key')

# Optional secrets with defaults
ADMIN_USER = _read_secret('admin_user', required=False) or os.environ.get('ADMIN_USER', 'admin')
ADMIN_PASS = _read_secret('admin_pass', required=False) or os.environ.get('ADMIN_PASS', 'admin')

# Microsoft Graph API Configuration
GRAPH_SCOPE = os.environ.get("GRAPH_SCOPE", "https://graph.microsoft.com/.default")
GRAPH_CONFIG_ENDPOINT = os.environ.get("GRAPH_CONFIG_ENDPOINT", "https://graph.microsoft.com/v1.0")

# OpenAI Configuration
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-3.5-turbo")

# Application Configuration
CHECK_INTERVAL_MINUTES = int(os.environ.get("CHECK_INTERVAL_MINUTES", "10"))
DATABASE_PATH = os.environ.get("DATABASE_PATH", "monitor_data.db")

# Logging Configuration
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# Display configuration status
print(f"✓ Configuration loaded successfully")
print(f"  Environment: {'Docker' if IS_DOCKER else 'Local Development'}")
print(f"  Check interval: {CHECK_INTERVAL_MINUTES} minutes")
print(f"  OpenAI Model: {OPENAI_MODEL}")

# Security warning
if ADMIN_PASS == "admin":
    print("⚠️  WARNING: Using default admin password. Create secrets/admin_pass.txt for production!")

