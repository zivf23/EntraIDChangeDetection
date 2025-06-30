### backend/graph_client.py (Fixed imports)

"""
Microsoft Graph API client for retrieving Entra ID configuration.
"""

import requests
import msal
import logging
from datetime import datetime
from config import GRAPH_CLIENT_ID, GRAPH_TENANT_ID, GRAPH_CLIENT_SECRET, GRAPH_SCOPE, GRAPH_CONFIG_ENDPOINT

logger = logging.getLogger(__name__)

# Initialize MSAL client
_auth_app = msal.ConfidentialClientApplication(
    GRAPH_CLIENT_ID,
    authority=f"https://login.microsoftonline.com/{GRAPH_TENANT_ID}",
    client_credential=GRAPH_CLIENT_SECRET
)

def _get_access_token():
    """Get access token for Microsoft Graph API."""
    result = _auth_app.acquire_token_for_client(scopes=[GRAPH_SCOPE])
    if "access_token" in result:
        return result["access_token"]
    
    error_msg = f"Failed to obtain access token: {result.get('error')}, {result.get('error_description')}"
    logger.error(error_msg)
    raise RuntimeError(error_msg)

def get_current_config():
    """
    Retrieve current configuration from Microsoft Entra ID.
    
    Returns:
        list: List of users from Entra ID
    """
    try:
        token = _get_access_token()
        headers = {"Authorization": f"Bearer {token}"}
        
        # Fetch users
        logger.info("Fetching users from Graph API")
        response = requests.get(f"{GRAPH_CONFIG_ENDPOINT}/users", headers=headers)
        response.raise_for_status()
        
        data = response.json()
        users = data.get("value", [])
        
        logger.info(f"Successfully retrieved {len(users)} users")
        return users
        
    except Exception as e:
        logger.error(f"Error retrieving configuration from Graph API: {e}", exc_info=True)
        raise
