# Quick Sermon — Agent Instructions

## Project Overview
Web platform that automates sermon video processing: YouTube live URL -> timestamp detection -> download -> cut -> upload -> AI content generation -> review -> publish.

## Architecture

### Backend (Python 3.12 + FastAPI)
- **Async SQLAlchemy 2.0** — all DB access uses `AsyncSession` and `await session.execute()`
- **Module pattern** — each domain is self-contained under `app/modules/`
- **Dependency flow** — routes -> services -> repositories -> models (never reverse)
- **Modules never import from each other** — cross-module communication via Temporal activities
- **One service per use case** — each service file contains a single class with an `execute()` method

### Module Structure
Every module follows this pattern:
```
module/
├── __init__.py
├── routes.py           # FastAPI APIRouter, thin: validation + DI
├── models.py           # SQLAlchemy ORM models
├── schemas.py          # Pydantic v2 request/response DTOs
├── enums.py            # str Enums
├── exceptions.py       # Domain exceptions inheriting AppException
├── dependencies.py     # FastAPI Depends factories
├── repositories/       # Async data access
├── services/           # Business logic (one file per use case)
├── workflows.py        # Temporal workflows (if applicable)
├── activities.py       # Temporal activities (if applicable)
└── tests/
```

### Frontend (Next.js 14 App Router)
- **shadcn/ui** components in `components/ui/` — generated via CLI, do not edit manually
- **Feature components** in `components/features/` — grouped by domain
- **React Query** for server state, **Zustand** for client state (auth)
- **API client** in `lib/api/client.ts` — Axios with JWT interceptors

## Commands
```bash
# Docker
make up                  # Start all services
make up-dev              # Start with hot reload
make down                # Stop services
make logs                # View logs

# Backend
make test-backend        # Run pytest
make migrate             # Run Alembic migrations
make migration msg="..."  # Create new migration
make seed                # Seed database

# Frontend
make test-frontend       # Run tests
cd frontend && npm run dev  # Dev server (standalone)
```

## Conventions
- Python: ruff for linting, line length 99, target Python 3.12
- TypeScript: ESLint + Prettier
- Commit messages: conventional commits (feat, fix, chore, docs, test, refactor)
- Branch naming: feature/KAI-XX-description, fix/KAI-XX-description
- All backend tests use pytest with async mode
- Error handling: AppException base class, global handler returns structured JSON
- Errors never block the user flow — always provide manual fallback
