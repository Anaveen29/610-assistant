# 6:10 Assistant

An AI-powered overnight investigation system designed for security and operations teams to quickly assess what happened, what matters, and what requires action before morning leadership review.

---

## Project Overview

`6:10 Assistant` helps operators move from noisy overnight signals to actionable decisions.  
It uses a backend investigation agent to correlate events (time + location + pattern signals), surfaces uncertainty, and supports a human-in-the-loop review flow.

Core objective:
- Detect suspicious activity through event correlation
- Provide explainable reasoning and escalation guidance
- Support fast morning handoff with a generated briefing

---

## Features

- Event correlation engine (backend agent)
  - Correlates badge failures, fence alerts, and drone patrol timing
  - Adds reasoning notes and confidence signals
- Human-in-the-loop review
  - Approve / Challenge suspicious insights
- Drone simulation
  - Simulated drone check with status updates and contextual findings
- Escalation decision system
  - Automated `YES/NO` escalation output based on suspicious activity
- Morning briefing generation
  - Structured report for operations handoff
- Interactive map visualization
  - Leaflet map with event markers and detail popups

---

## Tech Stack

### Backend
- Django
- Django REST Framework (DRF)

### Frontend
- React
- Vite
- Tailwind CSS
- Leaflet + React-Leaflet
- Axios

---

## Architecture

The system is split into two independently runnable apps:

1. Frontend (`/frontend`)
   - Loads event data and investigation outputs from backend APIs
   - Renders map, review workflows, escalation decision, and briefing UI

2. Backend (`/backend`)
   - Serves REST endpoints:
     - `GET /api/events/`
     - `GET /api/investigate/`
   - Runs the investigator agent to correlate events and produce structured outputs

3. Investigator Agent (`backend/core/investigator_agent.py`)
   - Loads simulated overnight events
   - Uses tool-style helpers (location/time filters)
   - Detects suspicious sequence patterns
   - Returns:
     - summary
     - suspicious / harmless / needs_followup
     - confidence
     - escalation_required
     - reasoning_notes
     - drone_context
     - agent_logs

Data flow:
- Frontend requests `/api/events/` + `/api/investigate/`
- Backend agent processes events and returns investigation JSON
- Frontend visualizes findings and supports human decisions

---

## How to Run

## 1) Backend

```bash
cd backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend will run on: `http://127.0.0.1:8000`

## 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on Vite dev server (typically `http://127.0.0.1:5173`) and proxy API calls to Django.

---

## Example Investigation Flow

Typical overnight sequence:

1. Badge failure at Gate 3
2. Fence alert shortly after
3. Drone patrol verification near the same area
4. Agent marks suspicious correlation
5. Escalation decision set to `YES` when criteria are met
6. Operator approves/challenges insights
7. Morning briefing generated for leadership handoff

---

## API Response Shape (Investigation)

`GET /api/investigate/` returns:

```json
{
  "summary": "string",
  "suspicious": [],
  "harmless": [],
  "needs_followup": [],
  "agent_logs": [],
  "confidence": "medium",
  "escalation_required": true,
  "reasoning_notes": [],
  "drone_context": []
}
```

---

## Screenshots

Add screenshots here before submission:

- `docs/screenshots/dashboard-map.png` — Main dashboard with map + investigation panel
- `docs/screenshots/ai-investigation.png` — Suspicious events + reasoning timeline
- `docs/screenshots/escalation-briefing.png` — Escalation decision + morning briefing

> Tip: Keep screenshots focused on decision-making UI, not only raw event lists.

---

## Submission Notes

For assignment/demo readiness, include:
- Hosted frontend/backend (or combined deployment)
- GitHub repository
- Short architecture + tradeoff write-up
- Demo video walkthrough (voiceover recommended)

