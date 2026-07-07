"""
app.py - Startup Blueprint Generator Agent
==========================================
Flask web application entry point.
Exposes REST API endpoints consumed by the frontend dashboard.
"""

import os
import json
import re
from flask import Flask, render_template, request, jsonify, session, Response
from dotenv import load_dotenv
from agent import generate_blueprint, MODULE_PROMPTS, _build_model, repair_markdown_tables

# ---------------------------------------------------------------------------
# App initialisation
# ---------------------------------------------------------------------------
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-change-in-production")

# ---------------------------------------------------------------------------
# Helper - markdown to basic HTML conversion (no extra dependencies)
# ---------------------------------------------------------------------------

def md_to_html(text: str) -> str:
    """
    Convert lightweight markdown produced by Granite into HTML suitable for
    rendering inside the dashboard report cards.
    Handles: headings (##, ###), bold (**), bullet points (\u2022, -, *), and
    newlines - without requiring a full markdown library.
    """
    if not text:
        return ""

    lines = text.split("\n")
    html_parts = []
    in_ul = False

    for line in lines:
        stripped = line.strip()

        # --- headings ---
        if stripped.startswith("## "):
            if in_ul:
                html_parts.append("</ul>")
                in_ul = False
            html_parts.append(f'<h5 class="report-heading">{stripped[3:]}</h5>')
            continue

        if stripped.startswith("### "):
            if in_ul:
                html_parts.append("</ul>")
                in_ul = False
            html_parts.append(f'<h6 class="report-subheading">{stripped[4:]}</h6>')
            continue

        # --- bullet points ---
        if stripped.startswith(("\u2022 ", "- ", "* ")) and not stripped.startswith("**"):
            content = stripped[2:]
            content = _inline_md(content)
            if not in_ul:
                html_parts.append('<ul class="report-list">')
                in_ul = True
            html_parts.append(f"<li>{content}</li>")
            continue

        # Close list if we hit non-bullet content
        if in_ul and stripped:
            html_parts.append("</ul>")
            in_ul = False

        # --- numbered list ---
        num_match = re.match(r"^(\d+)\.\s+(.*)", stripped)
        if num_match:
            content = _inline_md(num_match.group(2))
            html_parts.append(f'<p class="mb-1"><strong>{num_match.group(1)}.</strong> {content}</p>')
            continue

        # --- blank line ---
        if not stripped:
            if in_ul:
                html_parts.append("</ul>")
                in_ul = False
            continue

        # --- paragraph ---
        html_parts.append(f'<p class="report-para">{_inline_md(stripped)}</p>')

    if in_ul:
        html_parts.append("</ul>")

    return "\n".join(html_parts)


def _inline_md(text: str) -> str:
    """Apply inline markdown: bold (**text**) and italic (*text*)."""
    # Bold
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    # Italic (single asterisk, avoid conflicts with bullets)
    text = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"<em>\1</em>", text)
    return text


# ---------------------------------------------------------------------------
# Routes - Pages
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    """Landing page with hero section."""
    return render_template("index.html")


@app.route("/generate")
def generate_page():
    """Legacy route - redirect to the dashboard which now hosts the AI prompt."""
    from flask import redirect
    return redirect("/dashboard", code=301)


@app.route("/dashboard")
def dashboard():
    """
    Blueprint results dashboard.
    The page shell is always served; blueprint data is stored in the
    browser's sessionStorage and rendered entirely client-side.
    """
    return render_template("dashboard.html")


# ---------------------------------------------------------------------------
# Routes - API
# ---------------------------------------------------------------------------

# Ordered list of all sections generated for a full blueprint
BLUEPRINT_SECTIONS = [
    "summary",
    "market_research",
    "competitor_analysis",
    "user_personas",
    "mvp_features",
    "business_model",
    "revenue_model",
    "go_to_market",
    "risk_analysis",
]

def _build_idea_text(data: dict) -> str:
    """Combine structured form fields into a rich idea prompt."""
    name     = data.get("startup_name", "").strip()
    desc     = data.get("business_description", "").strip()
    industry = data.get("industry", "").strip()
    audience = data.get("target_audience", "").strip()

    parts = []
    if name:
        parts.append(f"Startup Name: {name}")
    if industry:
        parts.append(f"Industry/Sector: {industry}")
    if audience:
        parts.append(f"Target Audience: {audience}")
    if desc:
        parts.append(f"Business Description: {desc}")
    return "\n".join(parts)


def _extract_meta_from_prompt(prompt: str) -> dict:
    """
    Use the first line / key phrases of a free-text prompt to derive
    a startup name, industry guess, and audience placeholder so the
    response JSON has the same shape as /api/generate-all.
    """
    # Derive a startup name from the prompt (first ~60 chars, trimmed to words)
    first_sentence = prompt.split(".")[0].strip()
    # Trim to a reasonable label length
    name = first_sentence[:60].strip()
    if len(first_sentence) > 60:
        name = name.rsplit(" ", 1)[0]  # avoid mid-word cut

    # Very rough industry inference from keywords
    industry_map = {
        ("health", "medical", "doctor", "patient", "clinic", "hospital", "care"): "HealthTech",
        ("finance", "fintech", "payment", "bank", "invest", "crypto", "wallet"): "FinTech",
        ("educat", "study", "learn", "student", "school", "course", "tutor"): "EdTech",
        ("grocery", "food", "restaurant", "delivery", "meal", "cook", "recipe"): "FoodTech",
        ("ecommerce", "e-commerce", "shop", "retail", "store", "marketplace"): "E-commerce",
        ("saas", "b2b", "enterprise", "software", "platform", "api", "tool"): "SaaS / B2B Software",
        ("ai", "machine learning", "ml", "nlp", "llm", "gpt", "artificial"): "AI / Machine Learning",
        ("real estate", "property", "proptech", "rental", "housing"): "Real Estate / PropTech",
        ("travel", "hotel", "hospitality", "booking", "flight", "trip"): "Travel / Hospitality",
        ("game", "gaming", "esport", "entertainment", "media", "content"): "Gaming / Entertainment",
        ("hr", "hiring", "recruit", "talent", "workforce", "remote work"): "HR / Future of Work",
        ("security", "cyber", "privacy", "compliance"): "Cybersecurity",
        ("legal", "law", "contract", "regulation"): "LegalTech / RegTech",
        ("clean", "green", "sustain", "renewable", "carbon", "climate"): "CleanTech",
        ("logistic", "supply chain", "shipping", "warehouse", "freight"): "Logistics / Supply Chain",
    }

    prompt_lower = prompt.lower()
    industry = "Technology"
    for keywords, label in industry_map.items():
        if any(kw in prompt_lower for kw in keywords):
            industry = label
            break

    return {
        "startup_name": name,
        "industry": industry,
        "target_audience": "Derived from prompt",
    }


@app.route("/api/generate-all", methods=["POST"])
def api_generate_all():
    """
    POST /api/generate-all
    ----------------------
    Generates all blueprint sections in one request.
    """
    data = request.get_json(force=True, silent=True) or {}

    startup_name = (data.get("startup_name") or "").strip()
    business_desc = (data.get("business_description") or "").strip()
    industry      = (data.get("industry") or "").strip()
    target_audience = (data.get("target_audience") or "").strip()

    # Validation
    if not business_desc:
        return jsonify({"success": False, "error": "Business description is required."}), 400
    if len(business_desc) < 20:
        return jsonify({"success": False, "error": "Please provide a more detailed business description (at least 20 characters)."}), 400
    if not startup_name:
        return jsonify({"success": False, "error": "Startup name is required."}), 400
    if not industry:
        return jsonify({"success": False, "error": "Please select an industry."}), 400
    if not target_audience:
        return jsonify({"success": False, "error": "Target audience is required."}), 400

    idea_text = _build_idea_text(data)

    def generate():
        yield json.dumps({
            "type": "meta",
            "startup_name": startup_name,
            "industry": industry,
            "target_audience": target_audience
        }) + "\n"

        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(BLUEPRINT_SECTIONS)) as executor:
            future_to_section = {
                executor.submit(generate_blueprint, startup_idea=idea_text, module=section_key): section_key
                for section_key in BLUEPRINT_SECTIONS
            }

            for future in concurrent.futures.as_completed(future_to_section):
                section_key = future_to_section[future]
                try:
                    result = future.result()
                    if not result["success"]:
                        yield json.dumps({
                            "type": "error",
                            "error": f"Failed to generate '{section_key}': {result.get('error', 'Unknown error')}"
                        }) + "\n"
                        return

                    raw = result["content"]

                    yield json.dumps({
                        "type": "section",
                        "key": section_key,
                        "raw": raw
                    }) + "\n"
                except Exception as e:
                    yield json.dumps({
                        "type": "error",
                        "error": f"Failed to generate '{section_key}': {str(e)}"
                    }) + "\n"
                    return

            yield json.dumps({"type": "done"}) + "\n"

    return Response(generate(), mimetype='application/x-ndjson')


@app.route("/api/generate-prompt", methods=["POST"])
def api_generate_prompt():
    """
    POST /api/generate-prompt
    -------------------------
    Generates all blueprint sections in one request using free-text prompt.
    """
    data = request.get_json(force=True, silent=True) or {}

    prompt = (data.get("prompt") or "").strip()
    selected_module = (data.get("module") or "").strip()

    if not prompt:
        return jsonify({"success": False, "error": "Please describe your startup idea."}), 400
    if len(prompt) < 10:
        return jsonify({"success": False, "error": "Please provide a more detailed description (at least 10 characters)."}), 400

    meta = _extract_meta_from_prompt(prompt)

    if selected_module and selected_module in BLUEPRINT_SECTIONS:
        modules_to_generate = [selected_module]
    else:
        modules_to_generate = BLUEPRINT_SECTIONS

    idea_text = f"Startup Name: {meta['startup_name']}\nIndustry/Sector: {meta['industry']}\nTarget Audience: {meta['target_audience']}\nBusiness Description: {prompt}"

    def generate():
        yield json.dumps({
            "type": "meta",
            "startup_name": meta["startup_name"],
            "industry": meta["industry"],
            "target_audience": meta["target_audience"]
        }) + "\n"

        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(modules_to_generate)) as executor:
            future_to_section = {
                executor.submit(generate_blueprint, startup_idea=idea_text, module=section_key): section_key
                for section_key in modules_to_generate
            }

            for future in concurrent.futures.as_completed(future_to_section):
                section_key = future_to_section[future]
                try:
                    result = future.result()
                    if not result["success"]:
                        yield json.dumps({
                            "type": "error",
                            "error": f"Failed to generate '{section_key}': {result.get('error', 'Unknown error')}"
                        }) + "\n"
                        return

                    raw = result["content"]

                    yield json.dumps({
                        "type": "section",
                        "key": section_key,
                        "raw": raw
                    }) + "\n"
                except Exception as e:
                    yield json.dumps({
                        "type": "error",
                        "error": f"Failed to generate '{section_key}': {str(e)}"
                    }) + "\n"
                    return

            yield json.dumps({"type": "done"}) + "\n"

    return Response(generate(), mimetype='application/x-ndjson')


@app.route("/api/chat-followup", methods=["POST"])
def api_chat_followup():
    """
    POST /api/chat-followup
    -----------------------
    Handles conversational follow-up section modifications, enforcing output schema format.
    """
    data = request.get_json(force=True, silent=True) or {}
    
    prompt = (data.get("prompt") or "").strip()
    section_key = (data.get("section_key") or "summary").strip()
    section_content = (data.get("section_content") or "").strip()
    original_prompt = (data.get("original_prompt") or "").strip()
    history = data.get("history") or []
    full_context = data.get("full_context") or {}
    
    if not prompt:
        return jsonify({"success": False, "error": "Question cannot be empty."}), 400

    from agent import MODULE_SCHEMAS, validate_section_json, generate_realistic_fallback
    schema_str = MODULE_SCHEMAS.get(section_key, "{}")
    
    # Construct blueprint context string from other sections
    context_str = ""
    if full_context:
        other_sections = []
        for key, value in full_context.items():
            if key != section_key and value:
                raw_data = value.get("raw") or ""
                if raw_data:
                    other_sections.append(f"- Section \"{key}\": {raw_data[:1200]}")
        if other_sections:
            context_str = "Here is the context from other generated sections of this startup blueprint:\n" + "\n".join(other_sections) + "\n\n"
    
    system_prompt = (
        f"You are the Startup Blueprint Assistant. Your job is to EDIT and REWRITE the active report section "
        f"\"{section_key}\" based on the user's follow-up request.\n\n"
        f"Here is the context of their startup idea:\n"
        f"\"{original_prompt}\"\n\n"
        f"{context_str}"
        f"Here is the current content of this active section (\"{section_key}\") in JSON format:\n"
        f"```json\n{section_content}\n```\n\n"
        f"Your response MUST be a valid JSON object matching this schema exactly:\n"
        f"{schema_str}\n\n"
        f"CRITICAL RULES:\n"
        f"1. Do NOT respond with conversational text, chat dialogue, or markdown code block wrappers (such as ```json ... ```). Output ONLY the raw JSON string itself.\n"
        f"2. For contextual requests (e.g. 'Improve this section', 'Add another persona', 'Make it suitable for India', 'Change the target audience', 'Simplify this explanation'), carefully adjust, add, or rewrite the values inside the JSON object to reflect the change, while maintaining the JSON schema structure exactly.\n"
        f"3. Fill every field. Do not leave fields blank, empty, or placeholder-like. Make reasonable, high-quality business assumptions."
    )
    
    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append({
            "role": msg.get("role", "user"),
            "content": msg.get("content", "")
        })
    messages.append({"role": "user", "content": prompt})

    
    try:
        model = _build_model()
        
        last_error = None
        cleaned_data = None
        for attempt in range(3):
            try:
                result = model.chat(messages=messages)
                choice = result.get("choices", [{}])[0]
                text = choice.get("message", {}).get("content", "").strip()
                if not text:
                    text = str(result).strip()

                is_valid, data_dict = validate_section_json(section_key, text)
                if is_valid:
                    cleaned_data = data_dict
                    break
            except Exception as exc:
                last_error = str(exc)

        if cleaned_data is None:
            cleaned_data = generate_realistic_fallback(section_key, original_prompt)

        json_str = json.dumps(cleaned_data)
        
        return jsonify({
            "success": True,
            "response": json_str,
            "content": json_str
        })
    except Exception as exc:
        return jsonify({"success": False, "error": f"Follow-up failed: {str(exc)}"}), 500


@app.route("/api/generate", methods=["POST"])
def api_generate():
    """
    POST /api/generate
    ------------------
    Generates a single section.
    """
    data = request.get_json(force=True, silent=True) or {}

    startup_idea = (data.get("startup_idea") or "").strip()
    module       = (data.get("module") or "summary").strip()

    if not startup_idea:
        return jsonify({"success": False, "error": "Please describe your startup idea."}), 400
    if len(startup_idea) < 10:
        return jsonify({"success": False, "error": "Please provide a more detailed startup idea (at least 10 characters)."}), 400
    if module not in BLUEPRINT_SECTIONS:
        module = "summary"

    result = generate_blueprint(startup_idea=startup_idea, module=module)
    if not result["success"]:
        return jsonify(result), 500

    raw_content = result["content"]

    return jsonify({
        "success":             True,
        "content":             raw_content,
        "raw":                 raw_content,
        "module":              module,
        "needs_clarification": False,
        "questions":           [],
    })


@app.route("/api/modules", methods=["GET"])
def api_modules():
    """Return available module keys and labels."""
    module_labels = {
        "summary":             "Startup Summary",
        "market_research":     "Market Research",
        "competitor_analysis": "Competitor Analysis",
        "user_personas":       "User Personas",
        "mvp_features":        "MVP Planner",
        "business_model":      "Business Model",
        "revenue_model":       "Revenue Model",
        "go_to_market":        "Go-to-Market Strategy",
        "risk_analysis":       "Risk Analysis",
        "full_blueprint":      "Full Blueprint",
    }
    return jsonify({"modules": module_labels})


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "model": os.getenv("WATSONX_MODEL_ID", "ibm/granite-3-3-8b-instruct")})


# ---------------------------------------------------------------------------
# Error handlers
# ---------------------------------------------------------------------------

@app.errorhandler(404)
def not_found(e):
    return render_template("404.html"), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"success": False, "error": "Internal server error. Please try again."}), 500

@app.after_request
def add_charset_header(response):
    ctype = response.headers.get("Content-Type", "")
    if "charset" not in ctype.lower():
        if "application/json" in ctype.lower():
            response.headers["Content-Type"] = "application/json; charset=utf-8"
        elif "html" in ctype.lower():
            response.headers["Content-Type"] = "text/html; charset=utf-8"
    return response


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    port  = int(os.getenv("FLASK_PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    print(f"\n[*] Startup Blueprint Generator Agent running on http://localhost:{port}\n")
    app.run(host="0.0.0.0", port=port, debug=debug, use_reloader=False)

