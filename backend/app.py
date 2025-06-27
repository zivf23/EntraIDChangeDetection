# backend/app.py
import os
import sys
from functools import wraps

from flask import Flask, jsonify, request
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler

# Verify critical environment variables (secrets) on startup
from config import GRAPH_CLIENT_ID, GRAPH_TENANT_ID, GRAPH_CLIENT_SECRET

def check_env_variables():
    """Verify that essential environment variables/secrets are present at startup."""
    required = {
        "GRAPH_CLIENT_ID": GRAPH_CLIENT_ID,
        "GRAPH_TENANT_ID": GRAPH_TENANT_ID,
        "GRAPH_CLIENT_SECRET": GRAPH_CLIENT_SECRET
    }
    print("\n--- Verifying Environment Variables ---")
    for k, v in required.items():
        masked = '********' if v and 'SECRET' in k else (v or 'Not Set')
        print(f" {k}: {masked}")
    print("---------------------------------------\n")
    missing = [k for k, v in required.items() if not v]
    if missing:
        print(f"!!! FATAL ERROR: Missing required environment variables: {missing}")
        print("!!! The application cannot start.")
        sys.exit(1)

check_env_variables()

# Delayed imports (after ensuring env/secrets are loaded)
from monitor import check_for_changes
from db import get_all_snapshots, get_snapshot_details, init_app as init_db

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Basic Authentication setup
ADMIN_USER = os.environ.get("ADMIN_USER", "admin")
ADMIN_PASS = os.environ.get("ADMIN_PASS", "admin")
if ADMIN_PASS == "admin":
    print("WARNING: Using default admin password. Set ADMIN_PASS environment variable for security.")

def auth_required(fn):
    """Decorator to enforce basic authentication on API routes."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth = request.authorization
        if not auth or auth.username != ADMIN_USER or auth.password != ADMIN_PASS:
            return jsonify({'message': 'Authentication required'}), 401, {
                'WWW-Authenticate': 'Basic realm="Login Required"'
            }
        return fn(*args, **kwargs)
    return wrapper

# API Routes

@app.route('/api/snapshots', methods=['GET'])
@auth_required
def snapshots():
    """Return a list of all snapshots (id and timestamp)."""
    all_snapshots = get_all_snapshots()
    return jsonify(all_snapshots)

@app.route('/api/snapshots/<int:snap_id>', methods=['GET'])
@auth_required
def snapshot_detail(snap_id):
    """Return full details of a specific snapshot, including previous state for comparison."""
    details = get_snapshot_details(snap_id)
    if not details:
        return jsonify({'message': 'Snapshot not found'}), 404
    return jsonify(details)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint to verify the server is running."""
    return jsonify({"status": "ok"}), 200

# Scheduler setup for periodic change detection
scheduler = BackgroundScheduler(daemon=True)
scheduler.add_job(func=check_for_changes, trigger='interval', minutes=int(os.environ.get("CHECK_INTERVAL_MINUTES", 10)), id="policy_check_job")

# Prevent double scheduling in debug mode with reloader
if not os.environ.get('WERKZEUG_RUN_MAIN'):
    scheduler.start()
    print(f"Scheduler started. Will check for changes every {os.environ.get('CHECK_INTERVAL_MINUTES', 10)} minutes.")
    # Perform one immediate check on startup
    print("Performing initial configuration check...")
    check_for_changes()

# Initialize the database (create tables if not exist)
init_db(app)
