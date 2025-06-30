### backend/db.py (Fixed imports)
```python
"""
Database module for storing configuration snapshots and changes.
"""

import sqlite3
import json
from datetime import datetime
from flask import current_app, g
from config import DATABASE_PATH

def get_db():
    """Get database connection for current request."""
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db

def close_db(e=None):
    """Close database connection."""
    db = g.pop('db', None)
    if db is not None:
        db.close()

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
    app.teardown_appcontext(close_db)
    with app.app_context():
        init_db()

def get_all_snapshots():
    """Retrieve all snapshots (id and timestamp only)."""
    db = get_db()
    rows = db.execute("SELECT id, timestamp FROM snapshots ORDER BY timestamp DESC").fetchall()
    return [{"id": row["id"], "timestamp": row["timestamp"]} for row in rows]

def get_snapshot_details(snap_id):
    """Retrieve full details of a specific snapshot."""
    db = get_db()
    current = db.execute("SELECT * FROM snapshots WHERE id=?", (snap_id,)).fetchone()
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

def save_snapshot(config, changes, explanation):
    """Save a new configuration snapshot."""
    db = get_db()
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%SZ")
    db.execute(
        "INSERT INTO snapshots (timestamp, config, changes, explanation) VALUES (?, ?, ?, ?)",
        (timestamp, json.dumps(config), json.dumps(changes), explanation)
    )
    db.commit()
    return timestamp