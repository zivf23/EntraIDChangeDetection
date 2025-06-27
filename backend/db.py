# backend/db.py
import sqlite3
import json
from flask import current_app, g

# Default path for the SQLite database file
DEFAULT_DB_PATH = 'monitor_data.db'

def get_db():
    """Open a new database connection for the current application context, or use an existing one."""
    db_path = current_app.config.get('DATABASE', DEFAULT_DB_PATH) if current_app else DEFAULT_DB_PATH
    if 'db' not in g:
        g.db = sqlite3.connect(db_path)
        g.db.row_factory = sqlite3.Row
    return g.db

def close_db(e=None):
    """Close the database connection at the end of request."""
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    """Initialize the database by creating the snapshots table if it doesn't exist."""
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
    """Register database functions with the Flask app."""
    app.teardown_appcontext(close_db)
    with app.app_context():
        init_db()

def get_all_snapshots():
    """Retrieve a list of all snapshots (id and timestamp) for overview."""
    db = get_db()
    rows = db.execute("SELECT id, timestamp FROM snapshots ORDER BY timestamp DESC").fetchall()
    return [{"id": row["id"], "timestamp": row["timestamp"]} for row in rows]

def get_snapshot_details(snap_id):
    """Retrieve full details of a specific snapshot, including the previous config for diff."""
    db = get_db()
    current = db.execute("SELECT * FROM snapshots WHERE id=?", (snap_id,)).fetchone()
    if not current:
        return None
    # Load JSON fields
    current_config = json.loads(current["config"])
    changes = json.loads(current["changes"]) if current["changes"] else []
    explanation = current["explanation"]
    # Try to get previous snapshot's config for comparison
    prev = db.execute("SELECT config FROM snapshots WHERE id < ? ORDER BY id DESC LIMIT 1", (snap_id,)).fetchone()
    previous_config = json.loads(prev["config"]) if prev and prev["config"] else None
    # Build the detail response
    return {
        "timestamp": current["timestamp"],
        "current_config": current_config,
        "previous_config": previous_config,
        "changes": changes,
        "explanation": explanation
    }
