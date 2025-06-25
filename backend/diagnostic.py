# backend/diagnostic.py
import os
import time

print("\n\n--- Running Diagnostic Script ---\n")

# קריאת המשתנים מהסביבה
tid = os.environ.get('GRAPH_TENANT_ID', '!!! NOT SET !!!')
cid = os.environ.get('GRAPH_CLIENT_ID', '!!! NOT SET !!!')
cs = os.environ.get('GRAPH_CLIENT_SECRET', '!!! NOT SET !!!')

# הדפסת Tenant ID
print("--- 1. Tenant ID ---")
print(f"Value: [{tid}]")
print(f"Length: {len(tid)}")
if len(tid) != 36:
    print("--> WARNING: Expected length is 36. Please check this value carefully!\n")

# הדפסת Client ID
print("--- 2. Client ID ---")
print(f"Value: [{cid}]")
print(f"Length: {len(cid)}")
if len(cid) != 36:
    print("--> WARNING: Expected length is 36. Please check this value carefully!\n")

# בדיקה אם ה-Client Secret קיים (בלי להדפיס אותו)
print("--- 3. Client Secret ---")
secret_status = "Exists" if cs and cs != '!!! NOT SET !!!' else "!!! NOT SET !!!"
print(f"Status: {secret_status}")
if secret_status == "Exists":
    print(f"Length: {len(cs)}\n")
else:
    print("--> WARNING: Client Secret is not set!\n")


print("--- End of Diagnostic. The container will now idle. Press Ctrl+C to stop. ---\n\n")

# השאר את הקונטיינר רץ כדי שנוכל לראות את הפלט
time.sleep(3600)