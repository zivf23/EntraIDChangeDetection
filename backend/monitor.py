### backend/monitor.py (Fixed database operations)

"""
Configuration monitoring module - detects changes and triggers explanations.
"""

import json
import sqlite3
import logging
from datetime import datetime
from graph_client import get_current_config
from openai_client import get_explanation
from config import DATABASE_PATH

logger = logging.getLogger(__name__)

def _compute_diff(old_config, new_config):
    """
    Compute differences between two configurations.
    
    Args:
        old_config: Previous configuration (list of objects)
        new_config: Current configuration (list of objects)
        
    Returns:
        list: List of change descriptions
    """
    changes = []
    
    # Index configs by ID
    old_index = {obj.get('id'): obj for obj in (old_config or [])}
    new_index = {obj.get('id'): obj for obj in (new_config or [])}
    
    # Find added items
    for obj_id, obj in new_index.items():
        if obj_id not in old_index:
            name = obj.get('displayName') or obj.get('userPrincipalName') or obj_id
            changes.append(f"User added: {name}")
    
    # Find removed items
    for obj_id, obj in old_index.items():
        if obj_id not in new_index:
            name = obj.get('displayName') or obj.get('userPrincipalName') or obj_id
            changes.append(f"User removed: {name}")
    
    # Find modified items
    for obj_id in set(old_index) & set(new_index):
        old_obj = old_index[obj_id]
        new_obj = new_index[obj_id]
        
        # Check important fields
        for key in ['displayName', 'userPrincipalName', 'accountEnabled', 'jobTitle']:
            old_val = old_obj.get(key)
            new_val = new_obj.get(key)
            if old_val != new_val:
                name = new_obj.get('displayName') or new_obj.get('userPrincipalName') or obj_id
                changes.append(f"User modified: {name} - {key} changed from '{old_val}' to '{new_val}'")
    
    return changes

def check_for_changes():
    """Check for configuration changes and save snapshot if changes detected."""
    conn = None
    try:
        logger.info("Starting configuration check")
        
        # Get current configuration
        current_config = get_current_config()
        
        # Connect to database
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        
        # Get previous configuration
        cur = conn.execute("SELECT config FROM snapshots ORDER BY id DESC LIMIT 1")
        row = cur.fetchone()
        previous_config = json.loads(row["config"]) if row else None
        
        # Determine changes
        if previous_config is None:
            changes = ["Initial configuration snapshot"]
            logger.info("Creating initial configuration snapshot")
        else:
            changes = _compute_diff(previous_config, current_config)
            logger.info(f"Found {len(changes)} changes")
        
        # Save snapshot if there are changes
        if changes:
            # Generate explanation for significant changes
            explanation = ""
            if len(changes) > 1 or (len(changes) == 1 and not changes[0].startswith("Initial")):
                explanation = get_explanation(changes)
            
            # Save to database
            timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%SZ")
            conn.execute(
                "INSERT INTO snapshots (timestamp, config, changes, explanation) VALUES (?, ?, ?, ?)",
                (timestamp, json.dumps(current_config), json.dumps(changes), explanation)
            )
            conn.commit()
            logger.info(f"Saved snapshot at {timestamp} with {len(changes)} changes")
        else:
            logger.info("No changes detected - snapshot not saved")
            
    except Exception as e:
        logger.error(f"Error during configuration check: {e}", exc_info=True)
    finally:
        if conn:
            conn.close()