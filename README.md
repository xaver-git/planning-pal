# PlanningPal — Prototype

A compliance copilot for UK planning applications. Enter your project details, upload your documents, and PlanningPal checks them against your council's exact rules before you submit — catching likely rejections early.

Built with Python and Flask as part of a group project for AI Impact on Business.

## Features

- **Landing page** — product overview and value proposition
- **Dashboard** — view past application checks with readiness scores
- **New check wizard** — 4-step guided flow: project details → council → documents → run
- **Compliance report** — blocking issues, warnings, and compliant items with policy references and suggested fixes
- **Settings** — organisation preferences and notification defaults
- **Help** — FAQ

## Running Locally

### Prerequisites

- Python 3.9 or later

### Setup

```bash
# 1. Create and activate a virtual environment (recommended)
python3 -m venv .venv
source .venv/bin/activate      # macOS / Linux
# .venv\Scripts\activate       # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the server
python3 app.py
```

The app will be available at **http://localhost:5000**.

## Project Structure

```
app.py              # Flask application — routes and mock data
requirements.txt    # Python dependencies

templates/
  _base.html        # HTML skeleton (Tailwind CDN, Lucide icons, fonts)
  _app_base.html    # Sidebar shell shared by all app pages
  landing.html      # Marketing landing page
  dashboard.html    # Application list
  new.html          # New check wizard
  report.html       # Compliance report
  settings.html     # Settings
  help.html         # FAQ

static/
  css/styles.css    # CSS variables, animations, custom components
  js/new.js         # New check wizard interactivity
  js/report.js      # Report interactivity (gauge, fix/dismiss, confetti)
```

## Tech Stack

- **Flask** — web server and routing
- **Jinja2** — server-side HTML templating
- **Tailwind CSS** (CDN) — utility-first styling
- **Lucide** (CDN) — icons
- **canvas-confetti** (CDN) — celebration animation on re-run
- **Vanilla JS** — interactive UI components (stepper, gauge, issue cards)
