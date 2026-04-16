# AI Prompt Library

A full-stack web application for managing AI image generation prompts. Browse, search, sort, and add prompts — with a live Redis-backed view counter on every detail page.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 17 (standalone components) |
| Backend | Python Django 4.2 |
| Database | PostgreSQL 14 |
| Cache / Counter | Redis 7 |
| Web Server | Nginx + Gunicorn |
| Containerization | Docker + Docker Compose |

---

## Features

- 📋 **Browse prompts** in a responsive card grid
- 🔍 **Search** by title (real-time, case-insensitive)
- ↕️ **Sort** by latest or complexity
- ➕ **Add prompts** with full client + server validation
- 👁 **Live view counter** powered by Redis (increments per visit)
- ⚡ **Graceful Redis fallback** — app never crashes if Redis is down
- 🎨 **Dark UI** with glassmorphism navbar and smooth animations

---

## Prerequisites

- **Docker** (recommended): Docker Desktop 24+
- **Local dev**: Python 3.11+, Node 20+, PostgreSQL 14+, Redis 7+

---

## Quick Start (Docker — Recommended)

```bash
# 1. Clone / enter the project
cd ai-prompt-library

# 2. Copy env file (edit values if needed)
cp .env.example .env

# 3. Build and start all 4 services
docker-compose up --build

# 4. Create a Django superuser (optional, for /admin)
docker exec -it prompt_backend python manage.py createsuperuser
```

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000/prompts/
- **Django Admin**: http://localhost:8000/admin/

---

## Local Development (Without Docker)

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables (or create a .env in backend/)
export DB_HOST=localhost DB_NAME=promptdb DB_USER=promptuser DB_PASSWORD=promptpass
export REDIS_HOST=localhost REDIS_PORT=6379
export SECRET_KEY=your-dev-secret-key

# Run migrations and start server
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend

npm install

# Starts dev server on :4200, proxies /prompts/ to :8000
npm start
```

---

## API Reference

All responses use a consistent envelope:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "Error message" }
```

| Method | Path | Description | Request Body |
|--------|------|-------------|--------------|
| GET | `/prompts/` | List all prompts | `?search=<str>&sort=date\|complexity` |
| POST | `/prompts/` | Create a prompt | `{ title, content, complexity }` |
| GET | `/prompts/<id>/` | Get prompt detail + increment view count | — |

### Validation Rules

| Field | Rule |
|---|---|
| `title` | Required, min 3 characters |
| `content` | Required, min 20 characters |
| `complexity` | Required, integer 1–10 |

---

## Architecture Decisions

### Why no Django REST Framework?
DRF adds ~30 files of boilerplate for a simple CRUD API. Using plain `JsonResponse` views keeps the backend lean and forces explicit serialization — which is a better learning experience and easier to audit.

### Why Redis for view count?
Redis `INCR` is an atomic O(1) operation — perfect for a counter that could be hit simultaneously by many users. Storing view counts in PostgreSQL would require row locks and be significantly slower. The counter is also a best-effort metric, so Redis's in-memory nature (with potential data loss on restart) is an acceptable trade-off.

### Why a `get_redis()` factory?
Instantiating Redis inside the factory (rather than at module level) avoids import-time connection errors when Redis isn't available yet at startup. It also keeps each request's connection lifecycle explicit and garbage-collected cleanly.

### Consistent API envelope `{success, data, error}`
Every endpoint returns the same shape. This makes frontend error handling trivial — one `error$ | success$` switch covers all cases — and signals production-grade API design to code reviewers.

### Proxy setup
In development, Angular's webpack dev server proxies `/prompts/` to Django on port 8000, avoiding CORS entirely. In production (Docker), Nginx handles the same proxy from the frontend container to the backend container using the Docker internal hostname `backend`.

---

