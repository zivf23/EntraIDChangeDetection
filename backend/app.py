# ===================================================================
# FILENAME: app.py
# PURPOSE: השרת הראשי של Flask. הקוד שלך נשמר במלואו.
# UPDATED: היבואים תוקנו לעבוד בצורה מוחלטת (absolute imports)
#          והבדיקות הועברו לתחילת הקובץ.
# ===================================================================
import os
import sys
from functools import wraps
from flask import Flask, jsonify, request
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler

# --- Environment validation ---
def check_env_variables():
    """בודק שמשתני הסביבה החיוניים קיימים בעת עליית השרת."""
    # Import the secrets from config.py
    from config import GRAPH_CLIENT_ID, GRAPH_TENANT_ID, GRAPH_CLIENT_SECRET    
    
    required = {
        "GRAPH_CLIENT_ID": GRAPH_CLIENT_ID,
        "GRAPH_TENANT_ID": GRAPH_TENANT_ID,
        "GRAPH_CLIENT_SECRET": GRAPH_CLIENT_SECRET,
    }
    print("\n--- Verifying Environment Variables ---")
    for k, v in required.items():
        masked = '********' if v and 'SECRET' in k else v or 'Not Set'
        print(f"  {k}: {masked}")
    print("---------------------------------------\n")
    missing = [k for k, v in required.items() if not v]
    if missing:
        print(f"!!! FATAL ERROR: Missing required environment variables: {missing}")
        print("!!! The application cannot start.")
        sys.exit(1)

check_env_variables()

# --- Delayed imports (after env check) ---
# 💡 שינוי: שימוש ב-absolute imports מהשורש של ה-backend.
from backend.monitor import check_for_changes
from backend.db import get_all_snapshots, get_snapshot_details
from backend.config import CHECK_INTERVAL_MINUTES

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}) # הגדרה מפורשת יותר של CORS

# --- Basic Auth ---
ADMIN_USER = os.environ.get("ADMIN_USER", "admin")
ADMIN_PASS = os.environ.get("ADMIN_PASS", "admin")

if ADMIN_PASS == "admin":
    print("WARNING: Using default admin password. Set ADMIN_PASS environment variable for security.")

def auth_required(fn):
    """Decorator to enforce basic authentication."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth = request.authorization
        if not auth or auth.username != ADMIN_USER or auth.password != ADMIN_PASS:
            return jsonify({'message': 'Authentication required'}), 401, {
                'WWW-Authenticate': 'Basic realm="Login Required"'
            }
        return fn(*args, **kwargs)
    return wrapper

# --- Routes ---
@app.route('/api/snapshots', methods=['GET'])
@auth_required
def snapshots():
    """מחזיר רשימה של כל ה-Snapshots."""
    all_snapshots = get_all_snapshots()
    return jsonify(all_snapshots)

@app.route('/api/snapshots/<int:snap_id>', methods=['GET'])
@auth_required
def snapshot_detail(snap_id):
    """מחזיר פרטים מלאים על Snapshot ספציפי, כולל המצב הקודם להשוואה."""
    details = get_snapshot_details(snap_id)
    if not details:
        return jsonify({'message': 'Snapshot not found'}), 404
    return jsonify(details)

@app.route('/api/health', methods=['GET'])
def health_check():
    """בדיקת "דופק" פשוטה כדי לוודא שהשרת רץ."""
    return jsonify({"status": "ok"}), 200

# --- Scheduler ---
def run_scheduler():
    """מפעיל את ה-Scheduler לבדיקות תקופתיות."""
    scheduler = BackgroundScheduler(daemon=True)
    scheduler.add_job(check_for_changes, 'interval', minutes=CHECK_INTERVAL_MINUTES, id="policy_check_job")
    
    # מניעת ריצה כפולה בסביבת פיתוח של Flask (עם reloader)
    if not scheduler.get_job('policy_check_job') or not os.environ.get('WERKZEUG_RUN_MAIN'):
        scheduler.start()
        print(f"Scheduler started. Will check for changes every {CHECK_INTERVAL_MINUTES} minutes.")
        
        # הרצה ראשונית אחת כדי לקבל נתונים מיד
        print("Performing initial configuration check...")
        try:
            with app.app_context():
                check_for_changes()
        except Exception as e:
            print(f"Initial check failed: {e}", file=sys.stderr)

run_scheduler()

if __name__ == '__main__':
    # הרצה מקומית לצורכי דיבוג בלבד
    app.run(host='0.0.0.0', port=5000, debug=True)