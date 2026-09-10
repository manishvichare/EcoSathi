# EcoSathi — API Contract

Shared source of truth for all 3 team members. If you change a field name,
add an endpoint, or change a response shape — update this file and tell
the team, since all 3 services are built against this contract.

---

## 1. Frontend ↔ Backend (Node.js/Express)

Base URL (local dev): `http://localhost:5000/api`

| Method | Endpoint | Auth? | Purpose |
|---|---|---|---|
| POST | `/auth/signup` | No | Create account → `{ token, user }` |
| POST | `/auth/login` | No | Login → `{ token, user }` |
| GET | `/cities/:name` | No | City profile + boundary |
| GET | `/environment/:city/today` | No | Current AQI, CO2, O2, health score |
| GET | `/environment/:city/history?range=30d` | No | Daily graph data |
| GET | `/compare?cities=a,b` | No | Side-by-side comparison |
| POST | `/complaints` | Yes | Submit complaint (multipart: `photo` + `description` + `cityName`) |
| GET | `/complaints/:id` | No | Complaint status + AI verdict |
| GET | `/notices/:city` | No | AI-generated authority notices |
| GET | `/leaderboard` | No | Points/leaderboard |
| POST | `/tasks/:id/complete` | Yes | Mark eco task done, award points |
| POST | `/chat` | No | Proxies to AI service chatbot |

**Auth header format** (for routes marked "Yes"):
```
Authorization: Bearer <jwt_token>
```

---

## 2. Backend ↔ AI Service (Python FastAPI)

Base URL (local dev): `http://localhost:8000`

Called internally by `backend/src/services/aiClient.js`. The frontend
**never** calls these directly.

| Method | Endpoint | Request | Response |
|---|---|---|---|
| POST | `/analyze-complaint` | multipart: `image`, `description` | `{ severity, category, summary }` |
| POST | `/generate-notice` | `{ description, category, severity, city, location }` | `{ notice_text }` |
| POST | `/daily-suggestion` | `{ cityMetrics }` | `{ tips: [...] }` |
| POST | `/predict-trend` | `{ historicalData: [{date, healthScore}] }` | `{ predictedScore, trend }` |
| POST | `/chat` | `{ message, cityContext }` | `{ reply }` |
| GET | `/health` | — | `{ status: "ok" }` |

---

## 3. Health Score Formula (must stay identical everywhere)

```
Health Score (0–100) =
    0.35 × greenCoverScore
  + 0.35 × inverseAqiScore
  + 0.15 × o2SufficiencyScore
  + 0.15 × co2BalanceScore
```

- `greenCoverScore` = green cover % (0–100, capped)
- `inverseAqiScore` = `100 - (aqi / 5)`, clamped 0–100 (AQI 0 → 100, AQI 500 → 0)
- `o2SufficiencyScore` = `(o2Released / o2Required) × 100`, capped at 100
- `co2BalanceScore` = `(co2Absorbed / o2Required) × 100`, capped at 100 (simplified proxy — no dedicated CO2 baseline was specified)

Implemented in `backend/src/services/healthScoreService.js`.
If the AI service's `/predict-trend` regression needs to reproduce this
scoring, use the same weights.

---

## 4. Core Formulas (section 6 of the architecture doc)

| Formula | Value |
|---|---|
| Green Cover % | (park + forest area) ÷ total city area × 100 |
| Estimated tree count | green cover area ÷ 25 m² per tree |
| CO₂ absorbed/year | tree count × 21 kg |
| O₂ released/year | tree count × 118 kg |
| O₂ required for population | population × 740 kg/person/year |

---

## 5. Environment Variables Each Service Needs

**frontend/.env**
```
VITE_API_BASE_URL=http://localhost:5000/api
```

**backend/.env**
```
MONGO_URI=...
JWT_SECRET=...
WAQI_API_TOKEN=...
AI_SERVICE_URL=http://localhost:8000
CLIENT_ORIGIN=http://localhost:5173
```

**ai-service/.env**
```
ANTHROPIC_API_KEY=...
LLM_PROVIDER=anthropic
BACKEND_ORIGIN=http://localhost:5000
```

---

## 6. Data Model Summary

| Entity | Owned by | Purpose |
|---|---|---|
| User | Backend | Auth, profile, points |
| City | Backend | Profile, boundary, metadata |
| EnvironmentData | Backend | Daily AQI/CO2/O2/health score per city |
| Complaint | Backend | Citizen report (photo + text + AI verdict) |
| Notice | Backend | AI-generated authority letter |
| Task | Backend | Eco-task definitions |
| LeaderboardEntry | Backend | Points/ranking per user |

See `docs/er-diagram.png` for relationships.