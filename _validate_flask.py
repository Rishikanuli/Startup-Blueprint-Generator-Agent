"""Flask app route validation — run with: python _validate_flask.py"""
import os, sys
os.environ.setdefault('WATSONX_API_KEY', 'test')
os.environ.setdefault('WATSONX_PROJECT_ID', 'test')
os.environ.setdefault('FLASK_SECRET_KEY', 'test-secret')

# Stub ibm_watsonx_ai so we can import without the SDK installed
from unittest.mock import MagicMock
sys.modules['ibm_watsonx_ai'] = MagicMock()
sys.modules['ibm_watsonx_ai.foundation_models'] = MagicMock()
sys.modules['ibm_watsonx_ai.metanames'] = MagicMock()

# Import the Flask app
import app as flask_app

# Verify all routes are registered
rules = [r.rule for r in flask_app.app.url_map.iter_rules()]
expected = ['/', '/dashboard', '/api/generate', '/api/modules', '/api/health', '/api/chat-followup']

all_ok = True
for r in expected:
    ok = r in rules
    status = '[OK]' if ok else '[MISSING]'
    print(f'  {status} Route: {r}')
    if not ok:
        all_ok = False

print()
if all_ok:
    print('[OK] All routes registered. Flask app loads cleanly.')
else:
    print('[FAIL] Some routes are missing!')
    raise SystemExit(1)
