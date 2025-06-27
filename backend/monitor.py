# backend/monitor.py
import json
import sqlite3
from datetime import datetime

from graph_client import get_current_config
from openai_client import get_explanation
from config import GRAPH_TENANT_ID

# Path to the SQLite database file (same as used in db.py)
DB_PATH = 'monitor_data.db'  # This matches DEFAULT_DB_PATH in db.py

def _compute_diff(old_config, new_config):
    """Compute differences between two configurations (lists of objects)."""
    changes = []
    # Index old and new configs by object ID (assuming each object has a unique 'id')
    old_index = {obj.get('id'): obj for obj in (old_config or [])}
    new_index = {obj.get('id'): obj for obj in (new_config or [])}
    # Detect added or updated items
    for obj_id, new_obj in new_index.items():
        if obj_id not in old_index:
            # New object added
            name = new_obj.get('displayName') or new_obj.get('name') or obj_id
            changes.append(f"Added object '{name}' (ID: {obj_id})")
        else:
            # Check for modifications in existing object
            old_obj = old_index[obj_id]
            for key, new_val in new_obj.items():
                if key == "id":
                    continue  # Skip ID field
                old_val = old_obj.get(key)
                if old_val != new_val:
                    name = new_obj.get('displayName') or new_obj.get('name') or obj_id
                    changes.append(f"Updated '{key}' for object '{name}' (ID: {obj_id}): '{old_val}' -> '{new_val}'")
    # Detect removed items
    for obj_id, old_obj in old_index.items():
        if obj_id not in new_index:
            name = old_obj.get('displayName') or old_obj.get('name') or obj_id
            changes.append(f"Removed object '{name}' (ID: {obj_id})")
    return changes

def check_for_changes():
    """Retrieve current config, compare with last snapshot, and save changes if any."""
    try:
        # Fetch the latest saved snapshot from the database
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.execute("SELECT config FROM snapshots ORDER BY id DESC LIMIT 1")
        row = cur.fetchone()
        previous_config = json.loads(row["config"]) if row and row["config"] else None

        # Get current configuration from Microsoft Graph
        current_config = get_current_config()

        # Determine changes
        if previous_config is None:
            changes = ["Initial snapshot of configuration"]  # First time
        else:
            changes = _compute_diff(previous_config, current_config)

        if previous_config is None or changes:
            # Generate explanation for changes (if any changes beyond initial snapshot note)
            explanation = ""
            if changes and not (len(changes) == 1 and changes[0].startswith("Initial snapshot")):
                explanation = get_explanation(changes)
            # Save new snapshot in the database
            timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%SZ")
            conn.execute(
                "INSERT INTO snapshots (timestamp, config, changes, explanation) VALUES (?, ?, ?, ?)",
                (timestamp, json.dumps(current_config), json.dumps(changes), explanation)
            )
            conn.commit()
            print(f"[{timestamp}] Configuration snapshot saved. Changes detected: {len(changes)} changes.")
        else:
            # No changes found; do nothing (no new snapshot)
            print("No configuration changes detected. No new snapshot saved.")
    except Exception as e:
        print(f"Error during change detection: {e}")
    finally:
        try:
            conn.close()
        except Exception:
            pass
