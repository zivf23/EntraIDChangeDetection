# ===================================================================
# FILENAME: graph_client.py
# Description: Simplified and cleaned for a standard server environment.
# UPDATED: No major changes needed, your code was clean. Added more printouts.
# ===================================================================
import requests
import msal
from backend.config import (
    GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET, GRAPH_TENANT_ID, 
    GRAPH_SCOPE, GRAPH_CONFIG_ENDPOINT
)

def get_graph_access_token():
    """Acquires an access token from Microsoft Entra ID."""
    authority = f"https://login.microsoftonline.com/{GRAPH_TENANT_ID}"
    
    app = msal.ConfidentialClientApplication(
        client_id=GRAPH_CLIENT_ID,
        authority=authority,
        client_credential=GRAPH_CLIENT_SECRET
    )
    
    # First, try to get a token from the cache
    result = app.acquire_token_silent(scopes=GRAPH_SCOPE, account=None)
    
    if not result:
        print("No suitable token in cache, getting a new one from AAD.")
        result = app.acquire_token_for_client(scopes=GRAPH_SCOPE)
        
    if "access_token" in result:
        return result['access_token']
    else:
        print(f"Error acquiring token: {result.get('error')}")
        print(f"Error description: {result.get('error_description')}")
        print(f"Correlation ID: {result.get('correlation_id')}")
        return None

def fetch_current_config():
    """
    Fetches the current list of Conditional Access Policies from Microsoft Graph API.
    """
    token = get_graph_access_token()
    if not token:
        print("Could not acquire access token. Aborting fetch.")
        return None
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        print(f"Fetching config from: {GRAPH_CONFIG_ENDPOINT}")
        # Added a timeout to prevent requests from hanging indefinitely
        response = requests.get(GRAPH_CONFIG_ENDPOINT, headers=headers, timeout=30)
        response.raise_for_status()  # This will raise an HTTPError for bad responses (4xx or 5xx)
        return response.json().get('value', [])
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error occurred while fetching config from Graph API: {e}")
        print(f"Response Body: {e.response.text}")
    except requests.exceptions.RequestException as e:
        print(f"An error occurred while fetching config from Graph API: {e}")
        
    return None