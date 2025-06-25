# ===================================================================
# FILENAME: db.py
# Description: Manages the SQLite database for storing snapshots.
# UPDATED: הוספת לוגיקה לטיפול בבסיס נתונים ריק, ושימוש ב-app context
#          כדי לקבל את הנתיב בצורה דינאמית.
# ===================================================================
import sqlite3
import json
import os
from flask import current_app, g

# נתיב ברירת מחדל, טוב להרצת סקריפטים מחוץ ל-Flask
DEFAULT_DB_PATH = os.path.join(os.path.dirname(__file__), 'monitor_data.db')

def get_db():
    """
    Creates and returns a new database connection for the current request context.
    If a connection already exists, it returns it.
    """
    db_path = current_app.config.get('DATABASE', DEFAULT_DB_PATH) if current_app else DEFAULT_DB_PATH
    if 'db' not in g:
        g.db = sqlite3.connect(db_path)
        g.db.row_factory = sqlite3.Row
    return g.db

def close_db(e=None):
    """Closes the database connection."""
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    """Initializes the database and creates the table if it doesn't exist."""
    db = get_db()
    db.execute("""
    CREATE TABLE IF NOT EXISTS snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        config TEXT NOT NULL,
        changes TEXT,
        explanation TEXT
    );
    """)
    db.commit()

def save_snapshot(ts, config, changes, expl):
    """Saves a new configuration snapshot to the database."""
    db = get_db()
    db.execute(
        "INSERT INTO snapshots (timestamp, config, changes, explanation) VALUES (?, ?, ?, ?)",
        (ts, json.dumps(config), json.dumps(changes), expl)
    )
    db.commit()
    print(f"Saved snapshot for timestamp: {ts}")

def get_latest_snapshot():
    """Retrieves the most recent snapshot from the database."""
    db = get_db()
    row = db.execute("SELECT config FROM snapshots ORDER BY id DESC LIMIT 1").fetchone()
    if row and row['config']:
        try:
            return json.loads(row['config'])
        except json.JSONDecodeError:
            print("Error decoding JSON from the latest snapshot.")
            return None
    return None

def get_all_snapshots():
    """Retrieves a list of all snapshots (id and timestamp)."""
    db = get_db()
    rows = db.execute("SELECT id, timestamp FROM snapshots ORDER BY timestamp DESC").fetchall()
    return [{"id": row["id"], "timestamp": row["timestamp"]} for row in rows]

def get_snapshot_details(snap_id):
    """
    Retrieves the full details for a specific snapshot, AND the config of the previous one.
    """
    db = get_db()
    
    # Fetch the selected snapshot
    current_snap = db.execute("SELECT * FROM snapshots WHERE id=?", (snap_id,)).fetchone()
    if not current_snap:
        return None
    
    # Fetch the snapshot immediately preceding the selected one
    previous_snap = db.execute("SELECT config FROM snapshots WHERE id < ? ORDER BY id DESC LIMIT 1", (snap_id,)).fetchone()

    details = {
        "timestamp": current_snap["timestamp"],
        "changes": json.loads(current_snap["changes"] or '[]'),
        "explanation": current_snap["explanation"],
        "current_config": json.loads(current_snap["config"] or '[]')
    }

    if previous_snap:
        details["previous_config"] = json.loads(previous_snap["config"] or '[]')
    else:
        # This is the very first snapshot, so there's no previous state
        details["previous_config"] = None 

    return details

def init_app(app):
    """Register database functions with the Flask app."""
    app.teardown_appcontext(close_db)
    with app.app_context():
        init_db()