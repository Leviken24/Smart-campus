# EcoTwin AI — Production Deployment Guide

**Project:** EcoTwin AI — AI-Powered Sustainable Campus Intelligence  
**Role:** Technical Lead & Frontend Lead (Person 1 + Person 3 Workstream)  
**Target Architecture:** Modular Monolith (FastAPI Backend + React/TypeScript Vite Frontend)

---

## 1. Deployment Architecture Overview

EcoTwin AI is designed to support two production deployment models:

1. **Decoupled Cloud Hosting (Recommended for Hackathons & Cloud PaaS):**
   - **Frontend:** Vercel, Netlify, or Cloudflare Pages (Static SPA).
   - **Backend:** Render, Railway, Fly.io, or AWS App Runner (Python ASGI).
2. **Unified Single-Server Hosting (VPS / Docker / Reverse Proxy):**
   - **Web Server:** Nginx or Caddy serving pre-built `frontend/dist` assets.
   - **API Proxy:** Reverse proxy `/api/*` and `/static/uploads/*` to `uvicorn app.main:app --port 8000`.

---

## 2. Frontend Deployment (Vercel / Netlify)

### A. Pre-requisites & Build Validation
- Ensure Node.js 18+ is installed.
- Production build command:
  ```bash
  cd frontend
  npm install
  npm run build
  ```
- Build output directory: `frontend/dist`.

### B. Client-Side Routing & SPA Fallback
React Router requires all client routes (e.g. `/campus-twin`, `/simulations`, `/ai-advisor`, `/reports`) to rewrite to `/index.html` on HTTP GET requests:
- **Vercel:** Handled automatically by [`frontend/vercel.json`](file:///d:/DSU-hackathon/frontend/vercel.json):
  ```json
  {
    "framework": "vite",
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- **Netlify / Cloudflare Pages:** Handled by [`frontend/public/_redirects`](file:///d:/DSU-hackathon/frontend/public/_redirects) (bundled directly to `dist/_redirects` during build):
  ```text
  /*    /index.html   200
  ```

### C. Required Frontend Environment Variables
Set in your frontend hosting dashboard:
- `VITE_API_BASE_URL`: The full URL to your deployed backend API (e.g. `https://ecotwin-api.onrender.com/api`).
  *(Note: If serving behind a reverse proxy on the same domain, leave as `/api`)*.

---

## 3. Backend Deployment (Render / Railway / Linux ASGI)

### A. ASGI Entry Point & Process Manager
- **Start Command:**
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
  ```
- **Process Definition:** Declared in both [`backend/Procfile`](file:///d:/DSU-hackathon/backend/Procfile) and [`Procfile`](file:///d:/DSU-hackathon/Procfile).
- **Dependencies:** Declared in [`backend/requirements.txt`](file:///d:/DSU-hackathon/backend/requirements.txt) (includes `fastapi`, `uvicorn[standard]`, `pydantic`, `pydantic-settings`, `sqlalchemy`, `httpx`, `python-multipart`, and `gunicorn`).

### B. Required Backend Environment Variables

| Variable Name | Production Value / Description | Sensitive? |
|---|---|:---:|
| `APP_ENV` | `production` | No |
| `DATABASE_URL` | `sqlite:////data/ecotwin.db` (with persistent disk) or PostgreSQL URL | No |
| `FRONTEND_ORIGIN` | Deployed frontend domain (e.g. `https://ecotwin-ai.vercel.app`) | No |
| `XAI_API_KEY` | Real xAI API Key from `console.x.ai` | **YES** |
| `XAI_MODEL` | `grok-beta` | No |
| `VISION_PROVIDER` | `mock` (or `roboflow` if external CV configured) | No |
| `VISION_API_KEY` | Provider API key (optional if mock) | **YES** |
| `VISION_MODEL` | `waste-detection-v1` | No |
| `MAX_IMAGE_UPLOAD_MB` | `8` | No |

---

## 4. Critical Database Persistence Notice (SQLite on Ephemeral Storage)

> [!WARNING]
> **Ephemeral Storage Limitation on Render / Railway / Heroku:**
> Standard free-tier PaaS containers utilize ephemeral filesystems. Any SQLite database located at `./ecotwin.db` will be **wiped on service restart, sleep, or redeployment**.

### Recommended Persistence Solutions:
1. **Persistent Disk Mount (Recommended for SQLite):**
   - On Render or Railway, attach a Persistent Disk Volume mounted at `/data`.
   - Set environment variable:
     `DATABASE_URL=sqlite:////data/ecotwin.db`
2. **Managed PostgreSQL (Zero Architectural Changes):**
   - Attach a free PostgreSQL database (e.g. Supabase, Neon, or Render Postgres).
   - Set environment variable:
     `DATABASE_URL=postgresql://user:password@host:port/dbname`
   - SQLAlchemy 2.0 ORM seamlessly handles PostgreSQL without modifying application schemas.

---

## 5. Post-Deployment Verification Checklist

1. **Backend Health Check:**
   ```bash
   curl -i https://<your-backend-domain>/api/health
   ```
   *Expected Response:* HTTP 200 OK
   ```json
   {
     "status": "healthy",
     "version": "1.0.0",
     "database": "connected",
     "providers": {
       "grok_configured": true,
       "vision_configured": true
     }
   }
   ```
2. **CORS Headers Verification:**
   ```bash
   curl -I -X OPTIONS https://<your-backend-domain>/api/health \
     -H "Origin: https://<your-frontend-domain>" \
     -H "Access-Control-Request-Method: GET"
   ```
   *Expected:* `Access-Control-Allow-Origin: https://<your-frontend-domain>`.
3. **Frontend Nested Route Refresh:**
   - Navigate to `https://<your-frontend-domain>/simulations`.
   - Hard refresh (`Ctrl+F5`).
   - *Expected:* Page reloads cleanly without 404 Not Found.
4. **Vision Inspector Pipeline:**
   - Upload sample test image (`recycle-check.jpg`).
   - Confirm status transitions from `requires_review` to `confirmed`.
