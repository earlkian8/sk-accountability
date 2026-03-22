# SKCheck — Sangguniang Kabataan Accountability Platform

A transparency and accountability platform for Sangguniang Kabataan (SK) programs in the Philippines. Citizens can browse barangay programs, verify or flag them, and leave comments. SK Officials manage programs through a dedicated admin portal. AI features powered by Gemini 2.5 Flash assist both the public and KK Members.

---

## Table of Contents

- [System Overview](#system-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [1. Supabase Setup](#1-supabase-setup)
- [2. Server Setup](#2-server-setup)
- [3. Frontend Setup](#3-frontend-setup)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [API Reference](#api-reference)
- [User Roles](#user-roles)
- [External Services](#external-services)
- [Deployment Notes](#deployment-notes)

---

## System Overview

```
Browser (React + Vite)
    │
    ├── PSGC Cloud API          → Philippine address data (regions/provinces/cities/barangays)
    ├── Nominatim (OpenStreetMap) → Reverse geocoding for auto-location detection
    ├── Gemini 2.5 Flash API    → AI chatbot (public) + credibility analysis (KK Member)
    │
    └── Express Backend (Node.js)
            │
            └── Supabase (PostgreSQL)
                    ├── programs
                    ├── votes
                    ├── comments
                    └── barangay_budgets
```

---

## Tech Stack

### Frontend
| Package | Purpose |
|---|---|
| React 18 + Vite | UI framework and build tool |
| Zustand | Global state management |
| Axios | HTTP client |
| `@google/genai` | Gemini AI SDK |
| `lucide-react` | Icons |
| `react-hot-toast` | Toast notifications |

### Backend
| Package | Purpose |
|---|---|
| Express | HTTP server |
| `@supabase/supabase-js` | Supabase client |
| `multer` | Photo upload handling (memory storage) |
| `cors` | Cross-origin requests |
| `helmet` | Security headers |
| `morgan` | HTTP request logging |
| `dotenv` | Environment variable loading |

### Database
| Service | Purpose |
|---|---|
| Supabase (PostgreSQL) | Programs, votes, comments, barangay budgets |
| Supabase Storage | Program photo uploads |

---

## Project Structure

```
skcheck/
│
├── server/                          ← Express backend
│   ├── controllers/
│   │   ├── programController.js     ← CRUD for programs
│   │   ├── barangayController.js    ← Budget GET/PATCH
│   │   ├── voteController.js        ← Verify/flag voting
│   │   ├── commentController.js     ← Program comments
│   │   └── uploadController.js      ← Photo upload to Supabase Storage
│   ├── routes/
│   │   └── api.js                   ← All API routes
│   ├── services/
│   │   ├── supabaseClient.js        ← Supabase client init (anon + service key)
│   │   └── storageService.js        ← Photo upload helper
│   ├── .env                         ← Server environment variables
│   ├── index.js                     ← Express app entry point
│   └── package.json
│
└── src/                             ← React frontend
    ├── ai/
    │   └── geminiService.js         ← Gemini 2.5 Flash (chat + credibility analysis)
    ├── api/
    │   └── client.js                ← Axios API client + PSGC helpers
    ├── store/
    │   └── appStore.js              ← Zustand global state
    ├── components/
    │   ├── AddressSelector.jsx      ← Cascading PH address picker + geolocation
    │   ├── AIPanel.jsx              ← Collapsible AI side panel
    │   ├── AIToggleButton.jsx       ← Floating AI open/close button
    │   ├── BudgetBar.jsx            ← Budget progress bar (fetches from DB)
    │   ├── CategoryIcon.jsx         ← Category tag component
    │   ├── CredibilityCard.jsx      ← KK Member AI credibility scorecard
    │   ├── ProgramCard.jsx          ← Program card for dashboard grid
    │   └── StatusBadge.jsx          ← Pending/Verified/Flagged badge
    ├── pages/
    │   ├── Dashboard.jsx            ← Public dashboard (browse programs)
    │   ├── ProgramDetail.jsx        ← Program detail + votes + comments + AI analysis
    │   └── SKAdminPortal.jsx        ← SK Official admin portal (full CRUD)
    ├── assets/
    │   └── sk-logo.svg
    ├── App.jsx                      ← Root component + routing
    ├── index.css                    ← Global styles + CSS variables
    └── main.jsx                     ← React entry point
```

---

## Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A **Supabase** account (free tier works) — [supabase.com](https://supabase.com)
- A **Google Gemini** API key — [aistudio.google.com](https://aistudio.google.com)

---

## 1. Supabase Setup

### 1a. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region close to the Philippines (e.g. Southeast Asia / Singapore)
3. Wait for the project to finish provisioning

### 1b. Run the schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Paste and run the following:

```sql
-- Drop existing tables if doing a fresh install
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS barangay_budgets CASCADE;

-- Programs
CREATE TABLE programs (
  id             uuid primary key default gen_random_uuid(),
  barangay_id    text not null,
  barangay_name  text,
  city_name      text,
  province_name  text,
  region_name    text,
  name           text not null,
  category       text check (category in ('Health','Sports','Livelihood','Environment','Culture')),
  budget         numeric not null,
  date           date not null,
  description    text,
  status         text default 'pending' check (status in ('pending','verified','flagged')),
  verifications  int default 0,
  flags          int default 0,
  photo_url      text,
  created_at     timestamptz default now()
);

CREATE INDEX programs_barangay_id_idx ON programs (barangay_id);

-- Votes (1 per voter per program)
CREATE TABLE votes (
  id         uuid primary key default gen_random_uuid(),
  program_id uuid references programs(id) on delete cascade,
  voter_id   text not null,
  vote_type  text check (vote_type in ('verify','flag')),
  created_at timestamptz default now(),
  UNIQUE(program_id, voter_id)
);

-- Comments
CREATE TABLE comments (
  id         uuid primary key default gen_random_uuid(),
  program_id uuid references programs(id) on delete cascade,
  author     text not null,
  role       text not null,
  text       text not null,
  date       timestamptz default now()
);

-- Barangay budgets (keyed by PSGC 10-digit barangay code)
CREATE TABLE barangay_budgets (
  barangay_code      text primary key,
  barangay_name      text,
  annual_budget      numeric default 0,
  ten_percent_budget numeric default 0,
  updated_at         timestamptz default now(),
  UNIQUE(barangay_code)
);
```

### 1c. Create a Storage bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Name it `skcheck-photos` (or your preferred name — match it in your `.env`)
4. Set it to **Public**
5. Under **Policies**, allow public reads and authenticated uploads (or make it fully public for simplicity during development)

### 1d. Collect your Supabase credentials

From your Supabase project **Settings → API**:
- **Project URL** — looks like `https://xxxxxxxxxxxx.supabase.co`
- **anon public key** — used for normal DB reads/writes
- **service_role key** — used for storage uploads (keep this secret, server-side only)

---

## 2. Server Setup

```bash
cd server
npm install
```

### Create `server/.env`

```env
# ── Supabase ──────────────────────────────────────────────────
# Project URL (Settings → API → Project URL)
DB_URL=https://xxxxxxxxxxxx.supabase.co

# Anon/public key (Settings → API → anon public)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service role key (Settings → API → service_role) — for storage uploads
SUPABASE_STORAGE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Storage bucket name (must match what you created in step 1c)
SUPABASE_STORAGE_BUCKET=skcheck-photos

# ── Server ────────────────────────────────────────────────────
PORT=3001
```

> ⚠️ Never commit `.env` to version control. Add it to `.gitignore`.

### Install dependencies

The server requires these packages. If `package.json` doesn't exist yet, run:

```bash
npm init -y
npm install express @supabase/supabase-js multer cors helmet morgan dotenv
```

### Start the server

```bash
# Development (with auto-restart)
npm install -g nodemon
nodemon index.js

# Or plain node
node index.js
```

The server runs on `http://localhost:3001` by default.

Verify it's working:
```bash
curl http://localhost:3001/health
# → {"status":"ok","app":"SKCheck"}
```

---

## 3. Frontend Setup

```bash
# From the project root (where src/ lives)
npm install
```

### Install dependencies

```bash
npm install react react-dom
npm install @vitejs/plugin-react vite
npm install axios zustand @google/genai
npm install lucide-react react-hot-toast
```

### Create `.env` (frontend root)

```env
# ── Backend API ───────────────────────────────────────────────
# URL of your Express server
VITE_API_URL=http://localhost:3001/api

# ── Gemini AI ─────────────────────────────────────────────────
# Get your key from https://aistudio.google.com
VITE_GEMINI_API_KEY=AIzaSy...

# ── Optional: override Gemini model ───────────────────────────
# Default is gemini-2.5-flash. Only change if you need a different model.
# VITE_GEMINI_MODEL=gemini-2.5-flash
```

> ⚠️ `VITE_` prefix is required for Vite to expose variables to the browser. Do not put secret keys (like Supabase service role key) here — those must stay server-side only.

### Start the frontend

```bash
npm run dev
```

The app runs on `http://localhost:5173` by default.

---

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|---|---|---|
| `DB_URL` | ✅ | Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Supabase anon/public API key |
| `SUPABASE_STORAGE_KEY` | ✅ | Supabase service role key (for storage uploads) |
| `SUPABASE_STORAGE_BUCKET` | ✅ | Name of the Supabase Storage bucket for photos |
| `PORT` | ❌ | Server port (default: `3001`) |

### Frontend (`.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Backend API base URL (e.g. `http://localhost:3001/api`) |
| `VITE_GEMINI_API_KEY` | ✅ | Google Gemini API key for AI features |
| `VITE_GEMINI_MODEL` | ❌ | Gemini model name (default: `gemini-2.5-flash`) |

---

## Running the App

Run both the server and frontend simultaneously — open two terminals:

**Terminal 1 — Backend:**
```bash
cd server
nodemon index.js
# Running on http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
npm run dev
# Running on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## API Reference

All endpoints are prefixed with `/api`.

### Programs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/programs?barangayId=<code>` | Get all programs for a barangay (PSGC code) |
| `GET` | `/programs/:id` | Get a single program with comments |
| `POST` | `/programs` | Create a new program |
| `PATCH` | `/programs/:id` | Update a program (name, budget, status, etc.) |
| `DELETE` | `/programs/:id` | Delete a program (cascades votes + comments) |

**POST/PATCH body:**
```json
{
  "name": "Kabataan Health Caravan 2026",
  "category": "Health",
  "budget": 45000,
  "date": "2026-03-01",
  "description": "...",
  "barangayId": "0972701001",
  "barangayName": "Molave",
  "cityName": "Molave",
  "provinceName": "Zamboanga del Sur",
  "regionName": "Zamboanga Peninsula",
  "photoUrl": null
}
```

### Votes

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/programs/:id/vote` | `{ voterId, voteType }` | Cast a verify or flag vote |

- `voteType`: `"verify"` or `"flag"`
- One vote per `voterId` per program (enforced by DB unique constraint)
- Auto-updates status: 3+ verifications → `verified`, 2+ flags → `flagged`

### Comments

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/programs/:id/comments` | — | Get all comments for a program |
| `POST` | `/programs/:id/comments` | `{ author, role, text }` | Add a comment |

### Barangay Budget

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/barangays/:code/budget` | — | Get budget for a barangay (returns zeros if not set) |
| `PATCH` | `/barangays/:code/budget` | `{ annualBudget, tenPercentBudget, barangayName }` | Set/update budget |

- `:code` is the PSGC 10-digit barangay code
- `tenPercentBudget` is optional — auto-computed as 10% of `annualBudget` if not provided

### Photo Upload

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/upload` | `multipart/form-data` field `photo` | Upload a program photo |

Returns `{ url: "https://..." }` — the public Supabase Storage URL.

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health check |

---

## User Roles

Roles are selected in the UI — no authentication is implemented. This is intentional for the current version (community transparency tool).

| Role | Label | Capabilities |
|---|---|---|
| `public` | Bisita | Browse programs, view details, leave comments, use AI chatbot |
| `kk-member` | KK Member | All of public + verify or flag programs + AI credibility analysis |
| `sk-official` | SK Official | All of public + access SK Admin Portal (add/edit/delete programs, set budget) |

**Status change rules:**
- SK Officials **cannot** change program status directly
- Status is changed automatically by the vote system:
  - 3+ verifications from KK Members → `verified`
  - 2+ flags from KK Members → `flagged`
  - New programs always start as `pending`

---

## External Services

### PSGC Cloud (`psgc.cloud/api`)
Free, no API key required. Provides the full Philippine Standard Geographic Code (PSGC) address hierarchy used for the cascading barangay selector.

Used endpoints:
- `GET /regions`
- `GET /regions/:code/provinces`
- `GET /provinces/:code/cities-municipalities`
- `GET /cities-municipalities/:code/barangays`

### Nominatim / OpenStreetMap
Free, no API key required. Used for reverse geocoding (lat/lng → address) for the auto-location detection feature. Rate limited to 1 request/second — not an issue for this use case.

### Google Gemini AI (`aistudio.google.com`)
Requires a free API key. Used for:
- **Public chatbot** — answers questions about barangay programs using streamed responses
- **KK Member credibility analysis** — scores a program's credibility (0–100) with strengths, concerns, and a recommendation

Model used: `gemini-2.5-flash` (configurable via `VITE_GEMINI_MODEL`)

### Supabase
Used for:
- **PostgreSQL database** — programs, votes, comments, barangay budgets
- **Storage** — program photo uploads

---

## Deployment Notes

### Backend (e.g. Railway, Render, Fly.io)

1. Set all server `.env` variables as environment variables in your deployment platform
2. Make sure `PORT` is set correctly (most platforms set it automatically)
3. Set the start command to `node index.js`

### Frontend (e.g. Vercel, Netlify)

1. Set `VITE_API_URL` to your deployed backend URL (e.g. `https://skcheck-api.railway.app/api`)
2. Set `VITE_GEMINI_API_KEY` in the platform's environment variable settings
3. Build command: `npm run build`
4. Output directory: `dist`

### CORS

When deploying, update the `cors()` middleware in `server/index.js` to allow only your frontend's domain:

```js
app.use(cors({
  origin: 'https://your-skcheck-frontend.vercel.app'
}))
```

### Supabase Storage — Public Access

Make sure your storage bucket policy allows public reads. In the Supabase dashboard:
- Go to **Storage → skcheck-photos → Policies**
- Add a policy: `SELECT` allowed for `anon` role with no conditions

---

## Common Issues

**"Hindi ma-load ang budget data" / "Hindi ma-save ang budget"**
→ The `barangay_budgets` table doesn't exist. Run the full schema SQL in the Supabase SQL editor.

**"Could not match province" during auto-location**
→ GPS accuracy is insufficient (common on desktop/laptop). Use the manual dropdowns to correct. The yellow "Mali ang lokasyon?" banner appears after auto-detection to prompt correction.

**"VITE_GEMINI_API_KEY is not set"**
→ Make sure `.env` is in the frontend root (same level as `package.json`) and the key starts with `VITE_`.

**Programs not loading after selecting barangay**
→ Check that the backend server is running and `VITE_API_URL` points to the correct URL.

**Photos not uploading**
→ Check that `SUPABASE_STORAGE_KEY` is the service role key (not the anon key) and `SUPABASE_STORAGE_BUCKET` matches the bucket name you created.