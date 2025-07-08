import json
import sqlite3
import logging
import time
from datetime import datetime, timezone

from graph_client import fetch_all_graph_data
from openai_client import get_explanation
from config import DATABASE_PATH, CHECK_INTERVAL_MINUTES

logger = logging.getLogger(__name__)

def _compute_diff(old_config: list, new_config: list, object_type: str):
    """
    Compute differences between two configurations for a specific object type.
    """
    changes = []
    old_index = {obj.get('id'): obj for obj in (old_config or [])}
    new_index = {obj.get('id'): obj for obj in (new_config or [])}

    # Find added items
    for obj_id, obj in new_index.items():
        if obj_id not in old_index:
            name = obj.get('displayName') or obj.get('userPrincipalName') or obj_id
            changes.append(f"{object_type.capitalize()} added: {name}")

    # Find removed items
    for obj_id, obj in old_index.items():
        if obj_id not in new_index:
            name = obj.get('displayName') or obj.get('userPrincipalName') or obj_id
            changes.append(f"{object_type.capitalize()} removed: {name}")

    # Find modified items
    for obj_id in set(old_index) & set(new_index):
        old_obj = old_index[obj_id]
        new_obj = new_index[obj_id]

        for key in ['displayName', 'userPrincipalName', 'accountEnabled', 'jobTitle', 'description']:
            if key in old_obj or key in new_obj:
                old_val = old_obj.get(key)
                new_val = new_obj.get(key)
                if old_val != new_val:
                    name = new_obj.get('displayName') or new_obj.get('userPrincipalName') or obj_id
                    changes.append(f"{object_type.capitalize()} modified: {name} - {key} changed from '{old_val}' to '{new_val}'")

    return changes

def check_for_changes():
    """Check for configuration changes and save snapshot if changes detected."""
    logger.info("="*20 + " Starting Configuration Check " + "="*20)

    endpoints_to_monitor = {
        "user": "/users?$select=id,displayName,userPrincipalName,jobTitle,accountEnabled",
        "group": "/groups?$select=id,displayName,description"
    }

    full_current_config = {}
    all_changes = []

    conn = None
    try:
        # Fetch current configuration for all endpoints
        for obj_type, endpoint in endpoints_to_monitor.items():
            logger.info(f"Fetching current state for: {obj_type}s")
            full_current_config[obj_type] = fetch_all_graph_data(endpoint)

        # Connect to database
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row

        # Get previous configuration
        cur = conn.execute("SELECT config FROM snapshots ORDER BY id DESC LIMIT 1")
        row = cur.fetchone()
        previous_config_data = json.loads(row["config"]) if row else None

        # --- IMPROVEMENT: Handle old data format gracefully ---
        is_initial_run = True
        full_previous_config = {}
        
        if previous_config_data:
            if isinstance(previous_config_data, dict):
                # This is the expected new format, proceed normally
                is_initial_run = False
                full_previous_config = previous_config_data
                logger.info("Previous configuration found in the correct format.")
            elif isinstance(previous_config_data, list):
                # This is the old format. Assume it's a list of users and migrate it.
                logger.warning("Old data format (list) detected. Migrating to new format for comparison.")
                is_initial_run = False
                # We build the new dictionary format from the old list data.
                # We assume the old format only contained users.
                full_previous_config = {
                    "user": previous_config_data,
                    "group": [] # Assume no groups were tracked in the old format
                }
        else:
            # This is the first run ever.
            logger.info("No previous configuration found. This is the first run.")


        # Determine changes for each object type
        if is_initial_run:
            all_changes = ["Initial configuration snapshot"]
            logger.info("Creating initial configuration snapshot")
        else:
            for obj_type in endpoints_to_monitor.keys():
                # Use .get() to safely access keys that might not exist in migrated data
                previous_state = full_previous_config.get(obj_type)
                current_state = full_current_config.get(obj_type)
                changes = _compute_diff(previous_state, current_state, obj_type)
                if changes:
                    all_changes.extend(changes)
            logger.info(f"Found a total of {len(all_changes)} changes across all types.")

        # Save snapshot if there are changes
        if all_changes:
            explanation = ""
            if len(all_changes) > 1 or (len(all_changes) == 1 and not all_changes[0].startswith("Initial")):
                explanation = get_explanation(all_changes)

            timestamp = datetime.now(timezone.utc).isoformat()
            conn.execute(
                "INSERT INTO snapshots (timestamp, config, changes, explanation) VALUES (?, ?, ?, ?)",
                (timestamp, json.dumps(full_current_config), json.dumps(all_changes), explanation)
            )
            conn.commit()
            logger.info(f"Saved snapshot at {timestamp} with {len(all_changes)} changes.")
        else:
            logger.info("No changes detected - snapshot not saved.")

    except Exception as e:
        logger.error(f"Error during configuration check: {e}", exc_info=True)
    finally:
        if conn:
            conn.close()
        logger.info("="*22 + " Configuration Check End " + "="*22 + "\n")


def start_monitoring():
    """Starts the monitoring loop."""
    logger.info("Monitoring service started.")
    while True:
        check_for_changes()
        sleep_seconds = CHECK_INTERVAL_MINUTES * 60
        logger.info(f"Check complete. Sleeping for {CHECK_INTERVAL_MINUTES} minutes...")
        time.sleep(sleep_seconds)

if __name__ == '__main__':
    start_monitoring()
