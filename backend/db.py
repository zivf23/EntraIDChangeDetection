### backend/db.py (Fixed imports)
"""
Database module for storing configuration snapshots and changes.
"""

import sqlite3
import json
from datetime import datetime
from flask import g # g is used to store the database connection for the current request - initialized every web request
from config import DATABASE_PATH

def get_db():
    """Get database connection for current request."""
    if 'db' not in g: # Check if db is already in g
        g.db = sqlite3.connect(DATABASE_PATH) # Connect to the database - save it in g
        g.db.row_factory = sqlite3.Row
    return g.db # This returns the database connection stored in g - if we already have it, we return the existing connection

def close_db(e=None):
    """Close database connection."""
    db = g.pop('db', None)
    if db is not None:
        db.close() # Close the database connection if it exists - g.pop removes the db from g and returns it, or None if it doesn't exist - not throwing an error if db is None

def init_db():
    """Initialize database schema."""
    db = get_db()
    db.execute("""
        CREATE TABLE IF NOT EXISTS snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            config TEXT NOT NULL,
            changes TEXT,
            explanation TEXT
        )
    """)
    db.commit()

def init_app(app): 
    """Register database functions with Flask app."""
    app.teardown_appcontext(close_db) # This registers the close_db function to be called when the app context ends - it will close the db connection if it exists
    with app.app_context(): # This ensures the app context is available when initializing the database - run init_db() only once when the app starts
        init_db()

def get_all_snapshots():
    """Retrieve all snapshots (id and timestamp only)."""
    db = get_db()
    rows = db.execute("SELECT id, timestamp FROM snapshots ORDER BY timestamp DESC").fetchall() # Fetch all snapshots ordered by timestamp in descending order
    return [{"id": row["id"], "timestamp": row["timestamp"]} for row in rows]

def get_snapshot_details(snap_id):
    """Retrieve full details of a specific snapshot."""
    db = get_db()
    current = db.execute("SELECT * FROM snapshots WHERE id=?", (snap_id,)).fetchone() # Fetch the snapshot by ID - and convert text into python objects - and get the previous snapshot for comparison either by ID or by timestamp for comparison
    if not current:
        return None
    
    # Load JSON fields
    current_config = json.loads(current["config"])
    changes = json.loads(current["changes"]) if current["changes"] else []
    explanation = current["explanation"]
    
    # Get previous snapshot for comparison
    prev = db.execute(
        "SELECT config FROM snapshots WHERE id < ? ORDER BY id DESC LIMIT 1", 
        (snap_id,)
    ).fetchone()
    previous_config = json.loads(prev["config"]) if prev else None
    
    return {
        "timestamp": current["timestamp"],
        "current_config": current_config,
        "previous_config": previous_config,
        "changes": changes,
        "explanation": explanation
    }
