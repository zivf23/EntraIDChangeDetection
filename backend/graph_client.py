"""
Microsoft Graph API client for retrieving Entra ID configuration.
Includes pagination support.
"""

import requests
import msal
import logging
from config import GRAPH_CLIENT_ID, GRAPH_TENANT_ID, GRAPH_CLIENT_SECRET, GRAPH_SCOPE, GRAPH_CONFIG_ENDPOINT

logger = logging.getLogger(__name__)

# Initialize MSAL client - This is efficient as it's created only once.
_auth_app = msal.ConfidentialClientApplication(
    GRAPH_CLIENT_ID,
    authority=f"https://login.microsoftonline.com/{GRAPH_TENANT_ID}",
    client_credential=GRAPH_CLIENT_SECRET
)

def _get_access_token():
    """Get access token for Microsoft Graph API. Handles caching automatically."""
    # This function was missing from your file. It's essential for authentication.
    result = _auth_app.acquire_token_for_client(scopes=[GRAPH_SCOPE])
    if "access_token" in result:
        return result["access_token"]
    
    error_msg = f"Failed to obtain access token: {result.get('error')}, {result.get('error_description')}"
    logger.error(error_msg)
    raise RuntimeError(error_msg)

def fetch_all_graph_data(endpoint: str):
    """
    Retrieve all data from a specified Microsoft Graph API endpoint, handling pagination.
    
    Args:
        endpoint (str): The API endpoint to query (e.g., "/users", "/groups").
        
    Returns:
        list: A list containing all items retrieved from the endpoint.
    """
    all_results = []
    try:
        # This call will now succeed because _get_access_token is defined above.
        token = _get_access_token()
        headers = {"Authorization": f"Bearer {token}"}
        
        next_url = f"{GRAPH_CONFIG_ENDPOINT}{endpoint}"
        
        logger.info(f"Fetching all data from endpoint: {endpoint}")
        
        # Pagination loop
        while next_url:
            response = requests.get(next_url, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            page_results = data.get("value", [])
            all_results.extend(page_results)
            
            next_url = data.get("@odata.nextLink")
            
            if next_url:
                logger.info(f"Fetching next page... (retrieved {len(all_results)} items so far)")

        logger.info(f"Successfully retrieved a total of {len(all_results)} items from {endpoint}")
        return all_results
        
    except Exception as e:
        logger.error(f"Error retrieving all data from Graph API endpoint {endpoint}: {e}", exc_info=True)
        # Re-raise the exception to allow the calling code to handle it
        raise
