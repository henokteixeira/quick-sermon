# Quick Sermon — Sistema de Clips de Pregacoes

![CI](https://github.com/henokteixeira/quick-sermon/actions/workflows/ci.yml/badge.svg)

Plataforma web que automatiza o pipeline de processamento de videos de pregacoes: da URL da live ate o video publicado no YouTube.

## Tech Stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0 (async), Alembic, PostgreSQL 16
- **Pipeline:** Temporal, yt-dlp, FFmpeg, Ollama (LLM local)
- **Frontend:** Next.js 14 (App Router), Tailwind CSS, shadcn/ui
- **Infra:** Docker Compose, Nginx

## Quick Start

```bash
# Generate .env with random secrets
make setup

# Start all services (migrations and seed run automatically)
make up
```

`make migrate` and `make seed` still exist for manual use, but are no longer required steps.

## Development

```bash
# Start with hot reload
make up-dev

# Run backend tests
make test-backend

# View logs
make logs
```

## Services

| Service | URL |
|---|---|
| Frontend | http://localhost |
| Backend API | http://localhost/api |
| Backend (direct) | http://localhost:8000 |
| Temporal UI | http://localhost:8081 |
| Ollama | http://localhost:11434 |

## Project Structure

```
backend/
  app/
    core/          # Shared infra: config, database, auth, exceptions
    modules/
      health/      # Health check endpoint
      auth/        # Login, register, JWT
      users/       # User CRUD + roles
      videos/      # Video processing pipeline (main domain)

frontend/
  app/             # Next.js App Router pages
  components/
    ui/            # shadcn/ui components
    layout/        # Sidebar, topbar, auth guard
    features/      # Feature-specific components
  lib/
    api/           # API client + typed functions
    hooks/         # React Query hooks
    stores/        # Zustand stores
    types/         # TypeScript types
```
