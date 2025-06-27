# backend/graph_client.py
import requests
import msal

from config import GRAPH_CLIENT_ID, GRAPH_TENANT_ID, GRAPH_CLIENT_SECRET, GRAPH_SCOPE, GRAPH_CONFIG_ENDPOINT

# Initialize the MSAL confidential client for authentication
_auth_app = msal.ConfidentialClientApplication(
    GRAPH_CLIENT_ID,
    authority=f"https://login.microsoftonline.com/{GRAPH_TENANT_ID}",
    client_credential=GRAPH_CLIENT_SECRET
)

def _get_access_token():
    """Authenticate with Microsoft Entra ID and return an access token for Microsoft Graph."""
    result = _auth_app.acquire_token_for_client(scopes=[GRAPH_SCOPE])
    if "access_token" in result:
        return result["access_token"]
    raise RuntimeError(f"Failed to obtain access token: {result.get('error')}, {result.get('error_description')}")

def get_current_config():
    """Retrieve the current configuration from Microsoft Entra ID via Microsoft Graph API.
    
    For demonstration, this fetches the list of users in the tenant. In a full implementation,
    this could retrieve other configuration components as needed.
    """
    token = _get_access_token()
    # Example Graph API call: list all users (could be replaced with other config endpoints)
    url = f"{GRAPH_CONFIG_ENDPOINT}/users"
    response = requests.get(url, headers={"Authorization": f"Bearer {token}"})
    response.raise_for_status()
    data = response.json()
    # Return the 'value' list from the response, which contains user objects
    users = data.get("value", [])
    return users
