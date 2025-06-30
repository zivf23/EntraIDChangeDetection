### backend/app.py (Updated imports)
"""
Flask application for EntraID Change Detection System.
Provides REST API endpoints for configuration snapshots and change tracking.
"""

import os
import sys
import logging
from functools import wraps
from flask import Flask, jsonify, request
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.events import EVENT_JOB_ERROR, EVENT_JOB_EXECUTED

# Import configuration
from config import (
    GRAPH_CLIENT_ID, GRAPH_TENANT_ID, GRAPH_CLIENT_SECRET,
    ADMIN_USER, ADMIN_PASS, CHECK_INTERVAL_MINUTES,
    LOG_LEVEL, LOG_FORMAT
)

# Configure logging
logging.basicConfig(level=getattr(logging, LOG_LEVEL), format=LOG_FORMAT)
logger = logging.getLogger(__name__)

# Import other modules
from monitor import check_for_changes
from db import get_all_snapshots, get_snapshot_details, init_app as init_db

# Initialize Flask app
app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

# Configure CORS
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://localhost:80"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

def verify_environment():
    """Verify required secrets are loaded."""
    logger.info("Verifying environment configuration...")
    
    required_vars = {
        "GRAPH_CLIENT_ID": GRAPH_CLIENT_ID,
        "GRAPH_TENANT_ID": GRAPH_TENANT_ID,
        "GRAPH_CLIENT_SECRET": GRAPH_CLIENT_SECRET
    }
    
    missing = []
    for name, value in required_vars.items():
        if not value:
            missing.append(name)
        else:
            masked = '********' if 'SECRET' in name else f"{value[:8]}..."
            logger.info(f"  {name}: {masked}")
    
    if missing:
        logger.error(f"Missing required configuration: {missing}")
        sys.exit(1)
    
    logger.info("✓ All required configuration present")

def auth_required(f):
    """Decorator for basic authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth = request.authorization
        
        if not auth:
            logger.warning(f"Missing authentication for {request.path}")
            return jsonify({
                'message': 'Authentication required',
                'error': 'missing_credentials'
            }), 401, {'WWW-Authenticate': 'Basic realm="EntraID Monitor"'}
        
        if auth.username != ADMIN_USER or auth.password != ADMIN_PASS:
            logger.warning(f"Invalid credentials from {request.remote_addr}")
            return jsonify({
                'message': 'Invalid credentials',
                'error': 'invalid_credentials'
            }), 401, {'WWW-Authenticate': 'Basic realm="EntraID Monitor"'}
        
        return f(*args, **kwargs)
    
    return decorated_function

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'message': 'Resource not found', 'error': 'not_found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}", exc_info=True)
    return jsonify({'message': 'Internal server error', 'error': 'internal_error'}), 500

# API Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "service": "EntraID Change Detection",
        "version": "1.0.0",
        "check_interval_minutes": CHECK_INTERVAL_MINUTES
    }), 200

@app.route('/api/snapshots', methods=['GET'])
@auth_required
def get_snapshots():
    """Get list of all configuration snapshots."""
    try:
        snapshots = get_all_snapshots()
        logger.debug(f"Retrieved {len(snapshots)} snapshots")
        return jsonify(snapshots), 200
    except Exception as e:
        logger.error(f"Error retrieving snapshots: {e}", exc_info=True)
        return jsonify({'message': 'Failed to retrieve snapshots', 'error': 'database_error'}), 500

@app.route('/api/snapshots/<int:snap_id>', methods=['GET'])
@auth_required
def get_snapshot(snap_id):
    """Get detailed information about a specific snapshot."""
    try:
        details = get_snapshot_details(snap_id)
        
        if not details:
            return jsonify({'message': 'Snapshot not found', 'error': 'not_found'}), 404
        
        return jsonify(details), 200
        
    except Exception as e:
        logger.error(f"Error retrieving snapshot {snap_id}: {e}", exc_info=True)
        return jsonify({'message': 'Failed to retrieve snapshot details', 'error': 'database_error'}), 500

@app.route('/api/info', methods=['GET'])
def get_info():
    """Get API information (no auth required)."""
    return jsonify({
        "service": "EntraID Change Detection API",
        "endpoints": {
            "health": "/api/health",
            "snapshots": "/api/snapshots (requires auth)",
            "snapshot_detail": "/api/snapshots/{id} (requires auth)"
        },
        "authentication": "Basic Auth required for data endpoints"
    }), 200

# Scheduler setup
scheduler = BackgroundScheduler(daemon=True)

def on_job_error(event):
    logger.error(f"Scheduled job failed: {event.exception}")

def on_job_executed(event):
    logger.info(f"Scheduled job completed successfully")

scheduler.add_listener(on_job_error, EVENT_JOB_ERROR)
scheduler.add_listener(on_job_executed, EVENT_JOB_EXECUTED)

scheduler.add_job(
    func=check_for_changes,
    trigger='interval',
    minutes=CHECK_INTERVAL_MINUTES,
    id='configuration_check',
    name='Check Entra ID Configuration',
    replace_existing=True
)

# Application startup
def startup_tasks():
    """Perform startup tasks."""
    logger.info("="*50)
    logger.info("Starting EntraID Change Detection System")
    logger.info("="*50)
    
    verify_environment()
    
    init_db(app)
    logger.info("✓ Database initialized")
    
    scheduler.start()
    logger.info(f"✓ Scheduler started (interval: {CHECK_INTERVAL_MINUTES} minutes)")
    
    logger.info("Performing initial configuration check...")
    try:
        check_for_changes()
        logger.info("✓ Initial check completed")
    except Exception as e:
        logger.error(f"Initial check failed: {e}", exc_info=True)
        logger.warning("System will retry on next scheduled interval")
    
    logger.info("="*50)
    logger.info("System ready! Access the UI at http://localhost")
    logger.info("="*50)

# Run startup tasks
if not os.environ.get('WERKZEUG_RUN_MAIN'):
    startup_tasks()

# Shutdown handler
import atexit
def shutdown():
    logger.info("Shutting down scheduler...")
    scheduler.shutdown(wait=False)

atexit.register(shutdown)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)