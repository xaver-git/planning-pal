import json
from flask import Flask, render_template, request

app = Flask(__name__)

COUNCILS = [
    {"name": "Westminster", "quirk": "Requires daylight/sunlight (BRE 209) assessments for any extension over 3m on terraced properties."},
    {"name": "Camden", "quirk": "Strict on tree protection — TPO checks required within 12m of any mature tree."},
    {"name": "Hackney", "quirk": "Mandates whole-life carbon assessment for any extension over 100sqm."},
    {"name": "Lambeth", "quirk": "Requires Sustainable Drainage (SuDS) statement for any impermeable surface increase."},
    {"name": "Brighton & Hove", "quirk": "Conservation areas dominate — material specification must reference local vernacular."},
    {"name": "Bristol", "quirk": "Air quality assessment required within 200m of an Air Quality Management Area."},
    {"name": "Manchester", "quirk": "Active travel statement required for any commercial change-of-use."},
    {"name": "Leeds", "quirk": "Refuse and recycling strategy must use Leeds City Council standard bin types."},
    {"name": "Oxford", "quirk": "Archaeological assessment frequently required — check the City Sites & Monuments Record."},
    {"name": "Cambridge", "quirk": "Cycle parking ratios are higher than national standards (1 space per bedroom)."},
]

APPLICATION_TYPES = ["Householder", "Full Planning", "Listed Building Consent", "Prior Approval", "Outline"]

PAST_APPLICATIONS = [
    {"id": "app-001", "project": "Loft conversion — 14 Glebe Road", "council": "Camden", "type": "Householder", "date": "3 days ago", "score": 88, "status": "Submitted"},
    {"id": "app-002", "project": "Garage to studio — 7 Ferndale Crescent", "council": "Brighton & Hove", "type": "Householder", "date": "1 week ago", "score": 64, "status": "Draft"},
    {"id": "app-003", "project": "Rear extension — Maple House", "council": "Westminster", "type": "Householder", "date": "2 weeks ago", "score": 91, "status": "Submitted"},
    {"id": "app-004", "project": "Mixed-use redevelopment — Quayside Mill", "council": "Bristol", "type": "Full Planning", "date": "1 month ago", "score": 71, "status": "Submitted"},
]

DEMO_APPLICATION = {
    "id": "demo",
    "project": "New rear extension — 22 Pembridge Villas",
    "council": "Westminster",
    "type": "Householder",
    "initialScore": 72,
}

DEMO_ISSUES = [
    {
        "id": "b1", "severity": "blocking",
        "title": "Daylight/sunlight assessment missing",
        "policyRef": "WLP-P7",
        "policyTitle": "Westminster Local Plan Policy 7 — Daylight & Sunlight",
        "policyExcerpt": "Development should not result in an unacceptable loss of daylight or sunlight to neighbouring properties. Extensions exceeding 3m depth on terraced properties require a BRE 209 assessment.",
        "explanation": "Extensions exceeding 3m depth on terraced properties require a BRE 209 daylight/sunlight assessment for affected neighbours. Your proposal extends 3.4m and no assessment is attached.",
        "suggestedFix": "Commission a BRE 209 assessment from a qualified consultant. Typical cost £450–800, turnaround 5–10 days. We can recommend three pre-vetted consultants in Westminster.",
    },
    {
        "id": "b2", "severity": "blocking",
        "title": "Materials description too vague",
        "policyRef": "WLP-P38",
        "policyTitle": "Westminster Local Plan Policy 38 — Design",
        "policyExcerpt": "All external materials must be specified in sufficient detail to allow assessment of compatibility with the surrounding context, including manufacturer, range and finish.",
        "explanation": "Application states ‘matching brick.’ Westminster requires specification of brick manufacturer, range, and pointing style for any extension visible from the public realm.",
        "suggestedFix": "Replace the materials note with: “External walls: facing brick to match existing — [Manufacturer: e.g., Ibstock Funton Old Chelsea], laid in Flemish bond with [recessed lime mortar pointing, NHL 3.5, bucket-handle finish] to match the host dwelling.”",
    },
    {
        "id": "w1", "severity": "warning",
        "title": "Tree survey may be required",
        "policyRef": "WLP-P34",
        "policyTitle": "Policy 34 — Trees and the Public Realm",
        "policyExcerpt": "Where works are proposed within the Root Protection Area of a TPO-protected tree, a BS 5837 survey must be submitted.",
        "explanation": "The proposal sits approximately 9m from a TPO-protected oak. A BS 5837 arboricultural survey is likely to be requested by the case officer.",
        "suggestedFix": "Commission a BS 5837 survey now to avoid a 4–6 week delay during validation. Include a Tree Protection Plan and method statement for foundations near the RPA.",
    },
    {
        "id": "w2", "severity": "warning",
        "title": "Drawing scale inconsistency",
        "policyRef": "WLP-VAL-3",
        "policyTitle": "Validation Requirements — Drawings",
        "policyExcerpt": "Householder applications should provide consistent metric scales across location, site, and elevation drawings.",
        "explanation": "Site plan is at 1:200, elevations at 1:50. Westminster prefers a consistent 1:100 for householder applications to allow officer comparison.",
        "suggestedFix": "Re-issue the site plan and elevations at 1:100. Keep the location plan at 1:1250 as required.",
    },
    {
        "id": "w3", "severity": "warning",
        "title": "Description mismatch between form and drawings",
        "policyRef": "WLP-VAL-1",
        "policyTitle": "Validation Requirements — Application Form",
        "policyExcerpt": "The description of development on the application form must reflect the proposal as shown on the submitted drawings.",
        "explanation": "Application form says ‘single storey extension’ but drawings show a partial first-floor element above the bay window.",
        "suggestedFix": "Update the description to: “Single storey rear extension with partial first-floor element above existing bay window.”",
    },
    {"id": "c1", "severity": "compliant", "title": "Site location plan present and to scale (1:1250)", "policyRef": "WLP-VAL-2", "policyTitle": "Validation — Location Plan", "policyExcerpt": "Verified.", "explanation": "", "suggestedFix": ""},
    {"id": "c2", "severity": "compliant", "title": "Ownership certificate signed (Certificate A)", "policyRef": "WLP-VAL-5", "policyTitle": "Validation — Ownership", "policyExcerpt": "Verified.", "explanation": "", "suggestedFix": ""},
    {"id": "c3", "severity": "compliant", "title": "Application fee correct (£258)", "policyRef": "WLP-FEE", "policyTitle": "Householder Fee Schedule", "policyExcerpt": "Verified.", "explanation": "", "suggestedFix": ""},
    {"id": "c4", "severity": "compliant", "title": "Design & Access Statement present", "policyRef": "WLP-VAL-7", "policyTitle": "Validation — D&A Statement", "policyExcerpt": "Verified.", "explanation": "", "suggestedFix": ""},
    {"id": "c5", "severity": "compliant", "title": "Planning history checked — no recent refusals", "policyRef": "WLP-CTX", "policyTitle": "Site Context Review", "policyExcerpt": "Verified.", "explanation": "", "suggestedFix": ""},
]

REQUIRED_DOCS = [
    {"name": "Application Form", "received": True},
    {"name": "Site Location Plan (1:1250)", "received": True},
    {"name": "Existing & Proposed Elevations", "received": True},
    {"name": "Existing & Proposed Floor Plans", "received": True},
    {"name": "Design & Access Statement", "received": True},
    {"name": "Daylight / Sunlight Assessment (BRE 209)", "received": False},
    {"name": "Materials Schedule", "received": False},
]


@app.route("/")
def landing():
    return render_template("landing.html")


@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html", applications=PAST_APPLICATIONS)


@app.route("/new")
def new_check():
    return render_template(
        "new.html",
        councils=COUNCILS,
        application_types=APPLICATION_TYPES,
        required_docs=REQUIRED_DOCS,
        councils_json=json.dumps(COUNCILS),
    )


@app.route("/report/<app_id>")
def report(app_id):
    is_demo = app_id == "demo"
    if is_demo:
        app_data = DEMO_APPLICATION
        issues = DEMO_ISSUES
        score = 72
    else:
        app_data = next((a for a in PAST_APPLICATIONS if a["id"] == app_id), None)
        issues = []
        score = app_data["score"] if app_data else 75

    blocking = [i for i in issues if i["severity"] == "blocking"]
    warnings = [i for i in issues if i["severity"] == "warning"]
    compliant = [i for i in issues if i["severity"] == "compliant"]

    return render_template(
        "report.html",
        app_data=app_data,
        issues=issues,
        score=score,
        is_demo=is_demo,
        blocking=blocking,
        warnings=warnings,
        compliant=compliant,
        required_docs=REQUIRED_DOCS,
        issues_json=json.dumps(issues),
        app_id=app_id,
    )


@app.route("/settings")
def settings():
    return render_template("settings.html", councils=COUNCILS)


@app.route("/help")
def help_page():
    return render_template("help.html")


if __name__ == "__main__":
    app.run(debug=True, port=5000)
