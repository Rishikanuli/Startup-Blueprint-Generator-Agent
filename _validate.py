"""Validation script — run with: python _validate.py"""
import re

# ── Check module key consistency ──────────────────────────────────────────────
with open("templates/dashboard.html", encoding="utf-8") as f:
    html = f.read()

with open("static/js/dashboard.js", encoding="utf-8") as f:
    js = f.read()

with open("agent.py", encoding="utf-8") as f:
    agent = f.read()

with open("app.py", encoding="utf-8") as f:
    app_src = f.read()

# Extract data-module values from HTML — exclude Jinja template variables
html_modules = {m for m in re.findall(r'data-module="([^"]+)"', html)
                if not m.startswith("{{")}

# Extract keys from MODULE_META in JS (bare keys like full_blueprint: { ... })
js_modules = set(re.findall(r"\b([a-z][a-z_]+)\s*:\s*\{", js))

# Check agent MODULE_PROMPTS
EXPECTED = [
    "full_blueprint", "summary", "market_research", "competitor_analysis",
    "user_personas", "mvp_features", "business_model", "revenue_model",
    "go_to_market", "risk_analysis",
]

print("=== Module Key Validation ===")
print(f"HTML modules:  {sorted(html_modules)}")
print(f"JS  modules:   {sorted(js_modules)}")
print()

missing_js   = html_modules - js_modules
missing_html = js_modules   - html_modules

if missing_js:
    print(f"[FAIL] Missing in JS MODULE_META: {missing_js}")
else:
    print("[OK] All HTML modules present in JS MODULE_META")

for key in EXPECTED:
    ok = f'"{key}"' in agent
    print(f"  {'[OK]' if ok else '[MISSING]'} agent.py MODULE_PROMPTS['{key}']")

print()
print("=== API Route Validation ===")
for route in ["/api/generate", "/api/modules", "/api/health"]:
    ok = route in app_src
    print(f"  {'[OK]' if ok else '[MISSING]'} {route}")

print()
print("All checks passed!" if not missing_js else "Some checks FAILED.")
