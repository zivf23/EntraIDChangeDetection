import pytest
from monitor import diff_policies

def test_policy_created():
    changes = diff_policies([], [{'id':'1','displayName':'p'}])
    assert any('Policy Created' in c or 'נוצרה' in c for c in changes)
