import os
import time
import requests
import msal

print("\n\n--- Running Diagnostic Script ---\n")

# --- 1. Environment Variable Checks ---
print("--- 1. Verifying Environment Variables ---")
tid = os.environ.get('GRAPH_TENANT_ID')
cid = os.environ.get('GRAPH_CLIENT_ID')
cs = os.environ.get('GRAPH_CLIENT_SECRET')

# Check Tenant ID
if tid:
    print(f"[OK] GRAPH_TENANT_ID is set (Length: {len(tid)})")
    if len(tid) != 36:
        print("     --> WARNING: Expected length is 36. Please check this value.")
else:
    print("[FAIL] GRAPH_TENANT_ID is NOT SET!")

# Check Client ID
if cid:
    print(f"[OK] GRAPH_CLIENT_ID is set (Length: {len(cid)})")
    if len(cid) != 36:
        print("     --> WARNING: Expected length is 36. Please check this value.")
else:
    print("[FAIL] GRAPH_CLIENT_ID is NOT SET!")

# Check Client Secret
if cs:
    print(f"[OK] GRAPH_CLIENT_SECRET is set (Length: {len(cs)})")
else:
    print("[FAIL] GRAPH_CLIENT_SECRET is NOT SET!")

print("-" * 35)

# --- 2. Network Connectivity Test ---
print("\n--- 2. Testing Network Connectivity ---")
login_url = "https://login.microsoftonline.com"
try:
    response = requests.get(login_url, timeout=5)
    if response.status_code == 200:
        print(f"[OK] Successfully connected to {login_url}")
    else:
        print(f"[FAIL] Could not connect properly. Status code: {response.status_code}")
except requests.exceptions.RequestException as e:
    print(f"[FAIL] Network connection error: {e}")

print("-" * 35)


# --- 3. Authentication Test ---
print("\n--- 3. Testing Authentication with MSAL ---")
if cid and tid and cs:
    try:
        app = msal.ConfidentialClientApplication(
            client_id=cid,
            authority=f"https://login.microsoftonline.com/{tid}",
            client_credential=cs
        )
        result = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])
        
        if "access_token" in result:
            print("[SUCCESS] Successfully acquired an access token!")
            print("          Your credentials and permissions are correct.")
        else:
            print("[FAIL] Failed to acquire access token.")
            print(f"         Error: {result.get('error')}")
            print(f"         Description: {result.get('error_description')}")
    except Exception as e:
        print(f"[FAIL] An unexpected error occurred during authentication: {e}")
else:
    print("[SKIP] Skipping authentication test because one or more secrets are missing.")

print("\n--- End of Diagnostic. The container will now idle. Press Ctrl+C to stop. ---\n\n")

# השאר את הקונטיינר רץ כדי שנוכל לראות את הפלט
time.sleep(3600)