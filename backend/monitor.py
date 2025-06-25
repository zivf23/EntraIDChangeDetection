# ===================================================================
# FILENAME: monitor.py
# Description: The core logic for checking and comparing configurations.
# UPDATED: Imports fixed, error handling improved.
# ===================================================================
from datetime import datetime
import json
from backend.graph_client import fetch_current_config
from backend.db import get_latest_snapshot, save_snapshot
from backend.openai_client import get_change_explanation

def diff_policies(old_policies, new_policies):
    """
    Compares two lists of policy objects and identifies what changed.
    Returns a list of human-readable changes.
    """
    if old_policies is None:
        # This handles the very first run when the database is empty.
        return ["Initial configuration of Conditional Access Policies captured."]

    # Handle cases where API might return non-list types
    if not isinstance(old_policies, list) or not isinstance(new_policies, list):
        print("[Monitor] Error: old_policies or new_policies is not a list. Cannot compare.")
        return []

    changes = []
    
    try:
        old_policies_map = {p['id']: p for p in old_policies}
        new_policies_map = {p['id']: p for p in new_policies}
    except (TypeError, KeyError) as e:
        print(f"[Monitor] Warning: Could not create policy map due to unexpected data format: {e}. Aborting diff.")
        return []

    # Check for created or modified policies
    for policy_id, new_policy in new_policies_map.items():
        if policy_id not in old_policies_map:
            changes.append(f"מדיניות נוצרה: '{new_policy.get('displayName', 'Unknown Name')}'")
        else:
            old_policy = old_policies_map[policy_id]
            # Simple comparison by converting to string. For deep comparison, use a dedicated library.
            if json.dumps(old_policy, sort_keys=True) != json.dumps(new_policy, sort_keys=True):
                changes.append(f"מדיניות עודכנה: '{new_policy.get('displayName', 'Unknown Name')}'")

    # Check for deleted policies
    for policy_id, old_policy in old_policies_map.items():
        if policy_id not in new_policies_map:
            changes.append(f"מדיניות נמחקה: '{old_policy.get('displayName', 'Unknown Name')}'")

    return changes

def check_for_changes():
    """
    The main function executed by the scheduler to check for policy changes.
    """
    print("\n[Monitor] Starting check for configuration changes...")
    
    old_config = get_latest_snapshot()
    new_config = fetch_current_config()

    if new_config is None:
        print("[Monitor] Failed to fetch new configuration. Aborting check.")
        return

    # This is a critical check. If the configs are identical, do nothing.
    if old_config is not None and json.dumps(old_config, sort_keys=True) == json.dumps(new_config, sort_keys=True):
        print("[Monitor] No changes detected in Conditional Access Policies.")
        return
        
    changes = diff_policies(old_config, new_config)
    
    if not changes:
        if old_config is not None:
             print("[Monitor] No logical changes detected despite different object representation.")
        else:
             print("[Monitor] This is the first run, capturing initial state.")
             changes.append("Initial configuration of Conditional Access Policies captured.")
        # Do not return here, we want to save the first snapshot.
    
    print(f"[Monitor] Detected {len(changes)} change(s). Generating explanation...")
    explanation = get_change_explanation(changes)
    
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    # Save the full new configuration for the next comparison
    save_snapshot(timestamp, new_config, changes, explanation)
    print("[Monitor] Finished check and saved new snapshot.")