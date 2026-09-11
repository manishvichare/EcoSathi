# EcoSathi 🌱
Your City's Companion for a Greener Tomorrow — Urban Environmental Monitoring & Action Platform

3-tier hackathon project: **React frontend** ↔ **Node.js/Express backend** ↔ **Python FastAPI AI service**, all connected over REST, with MongoDB Atlas as the shared database.

```
ecosathi/
├── frontend/     (Person A — React + Vite)
├── backend/      (Person B — Node.js/Express + MongoDB)
├── ai-service/   (Person C — Python FastAPI + Claude/OpenAI)
└── docs/
    ├── api-contract.md
    └── er-diagram.png
```

---

## How the 3 services connect

```
 Browser
    │
    ▼
┌─────────────┐   REST (JSON/multipart)   ┌──────────────────┐   REST (JSON)   ┌───────────────┐
│  Frontend   │ ─────────────────────────► │     Backend      │ ───────────────► │  AI Service   │
│  :5173      │ ◄───────────────────────── │     :5000        │ ◄─────────────── │  :8000        │
└─────────────┘                             └────────┬─────────┘                 └───────────────┘
                                                       │
                                          ┌────────────┼────────────┐
                                          ▼            ▼            ▼
                                       WAQI API   Overpass API  MongoDB Atlas
```

**Golden rule:** the frontend never calls the AI service directly. Every AI
request goes Frontend → Backend → AI Service → back through the Backend.
This keeps one single, secure API surface (`localhost:5000/api/...`) for
the client to talk to.

The 3 services are connected purely through **environment variables that
point at each other's URLs** — there's no shared code between them. Every
teammate needs to set their `.env` correctly for the others to be reachable.

---

## Setup — run this once per service

### 1. Backend (Person B)
```bash
cd backend
npm install
cp .env.example .env      # then fill in real values (see below)
npm run dev                # runs on http://localhost:5000
```

### 2. AI Service (Person C)
```bash
cd ai-service
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # then fill in real values (see below)
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend (Person A)
```bash
cd frontend
npm install
cp .env.example .env       # VITE_API_BASE_URL=http://localhost:5000/api
npm run dev                 # runs on http://localhost:5173
```

**Start order matters:** MongoDB Atlas is always "up" (it's cloud-hosted),
but locally, start the **AI service first**, then the **backend** (so its
first request to the AI service doesn't fail), then the **frontend**.

---

## Environment variables — how the services find each other

| Variable | Lives in | Value | Why |
|---|---|---|---|
| `MONGO_URI` | `backend/.env` | your Atlas connection string | backend's database |
| `AI_SERVICE_URL` | `backend/.env` | `http://localhost:8000` | backend calls the AI service here (`aiClient.js`) |
| `CLIENT_ORIGIN` | `backend/.env` | `http://localhost:5173` | backend's CORS whitelist — lets the frontend call it |
| `BACKEND_ORIGIN` | `ai-service/.env` | `http://localhost:5000` | AI service's CORS whitelist — only the backend may call it |
| `VITE_API_BASE_URL` | `frontend/.env` | `http://localhost:5000/api` | frontend calls the backend here |

If any two of these don't match your actual running ports, you'll get
CORS errors or connection-refused errors — that's usually the #1 cause
of "nothing connects."

---

## Getting your API keys

You need **4 external accounts** — all free for hackathon-level usage.

### 1. MongoDB Atlas (database) — required
1. [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas) → sign up → create a free **M0** cluster
2. Database Access → add a DB user (username + password)
3. Network Access → Allow Access from Anywhere (`0.0.0.0/0`) — fastest for a hackathon
4. Connect → Drivers → Node.js → copy the connection string → paste into `backend/.env` as `MONGO_URI`

### 2. Anthropic API key (LLM + vision) — required for the AI service
1. [console.anthropic.com](https://console.anthropic.com) → sign up
2. Go to **API Keys** → **Create Key**
3. New accounts get free trial credits — enough for hackathon testing
4. Paste into `ai-service/.env` as `ANTHROPIC_API_KEY`

*(Optional: OpenAI key as an alternative — [platform.openai.com/api-keys](https://platform.openai.com/api-keys), set `LLM_PROVIDER=openai` if you use it instead.)*

### 3. WAQI token (air quality data) — required for real AQI numbers
1. [aqicn.org/data-platform/token](https://aqicn.org/data-platform/token/)
2. Enter your email → token is emailed instantly, no approval wait
3. Paste into `backend/.env` as `WAQI_API_TOKEN`

### 4. OpenStreetMap Overpass API (green cover) — no key needed
Overpass API is free and public — `greenCoverService.js` calls
`https://overpass-api.de/api/interpreter` directly, nothing to sign up for.

---

## Verifying everything is connected

Run each check in order:

1. **AI service alone:**
   ```
   curl http://localhost:8000/health
   ```
   → `{"status":"ok","service":"ecosathi-ai-service"}`

2. **Backend alone:**
   ```
   curl http://localhost:5000/api/health
   ```
   → `{"status":"ok","env":"development"}`

3. **Backend → AI service:**
   ```
   curl -X POST http://localhost:5000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"hello"}'
   ```
   If this works, your backend successfully reached the AI service.
   If it hangs or errors, check `AI_SERVICE_URL` in `backend/.env` and
   that `uvicorn` is actually running on port 8000.

4. **Frontend → Backend:**
   Open `http://localhost:5173`, open browser DevTools → Network tab,
   trigger any API call (e.g. load the dashboard) — you should see a
   `200` request to `localhost:5000/api/...`. A CORS error here means
   `CLIENT_ORIGIN` in `backend/.env` doesn't match your frontend's actual
   URL/port.

---

## Full API reference

See [`docs/api-contract.md`](./docs/api-contract.md) for every endpoint,
request/response shape, and the shared Health Score formula.

See [`docs/er-diagram.png`](./docs/er-diagram.png) for how the 7 MongoDB
collections relate to each other.

---

## Deploy the frontend and backend together on Render

This repository includes [`render.yaml`](./render.yaml). It creates one Node
web service that builds `frontend/`, then uses Express in `Backend/` to serve
the compiled React application and its `/api` endpoints from the same URL. No
separate static-site service, frontend URL, or production `VITE_API_URL` is
needed. It also defines an optional Python AI service for AI-powered routes.

1. Push this repository to GitHub (do not commit `.env` files).
2. In the Render dashboard choose **New → Blueprint**, connect the repository,
   and approve the `ecosathi` service detected from `render.yaml`.
3. Fill the secret environment variables requested by Render: `SUPABASE_URL`,
   `SUPABASE_SERVICE_KEY`, `WAQI_API_TOKEN`, `OPENWEATHER_API_KEY`, Cloudinary
   credentials, and optional Gmail credentials. Render generates `JWT_SECRET`.
4. If using AI-powered routes, deploy `ecosathi-ai`, set its `BACKEND_ORIGIN`
   to the Node service URL, add `GROQ_API_KEY`, then set the Node service's
   `AI_SERVICE_URL` to the AI service URL.
5. Deploy. Open `https://<your-service>.onrender.com/api/health` to confirm the
   service, then open `https://<your-service>.onrender.com` for the app.

`CLIENT_ORIGIN` is optional in this setup because client and API share one
origin. The Python `ai-service` cannot run inside this Node web service; it is
therefore a second optional Render service. It uses Groq's hosted text and
vision models, not Ollama.

---

## Team

| Person | Role | Owns |
|---|---|---|
| A | Frontend Dev | `frontend/` |
| B | Backend Dev | `backend/` |
| C | AI/ML Dev | `ai-service/` |
