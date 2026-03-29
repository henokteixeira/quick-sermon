# Backend — Agent Instructions

## Stack
Python 3.12 · FastAPI (async) · SQLAlchemy 2.0 (async) · PostgreSQL · Temporal · Pydantic v2 · JWT (PyJWT + bcrypt)

## Architecture

### Layer Flow
```
Route → Service → Repository → Model
```
- **Routes** are thin: inject dependencies, call one service, commit, return response. No business logic.
- **Services** contain all business logic. One class per use case, single `execute()` method.
- **Repositories** encapsulate database queries. Methods are all async. Never commit — routes control transaction scope.
- **Models** are SQLAlchemy ORM classes with `UUIDMixin` and `TimestampMixin`.

### Module Structure
Every domain lives under `app/modules/{name}/`:
```
module/
├── __init__.py
├── routes.py           # APIRouter — thin: DI + service call + commit
├── models.py           # SQLAlchemy ORM (Base, UUIDMixin, TimestampMixin)
├── schemas.py          # Pydantic v2 — request/response DTOs
├── enums.py            # StrEnum with lowercase values
├── exceptions.py       # Inherit from AppException hierarchy
├── dependencies.py     # FastAPI Depends() factories
├── repositories/       # Async data access (one file per repo)
├── services/           # Business logic (one file per use case)
├── workflows.py        # Temporal workflows (if applicable)
├── activities.py       # Temporal activities (if applicable)
└── tests/
```

### Core (`app/core/`)
| File | Purpose |
|------|---------|
| `app.py` | FastAPI factory, middleware, router registration |
| `config.py` | `Settings(BaseSettings)` — env-based config |
| `database.py` | Async engine + session factory, `get_db()` dependency |
| `models.py` | `Base`, `UUIDMixin`, `TimestampMixin` |
| `schemas.py` | `ErrorResponse`, `PaginatedResponse[T]` |
| `exceptions.py` | `AppException` → `NotFoundException`, `ValidationException`, etc. |
| `security.py` | JWT (access/refresh/stream tokens), bcrypt password hashing |
| `temporal_client.py` | Singleton `get_temporal_client()` |

## Conventions

### Routes
```python
@router.post("/", response_model=ClipResponse, status_code=201)
async def create_clip(
    data: ClipCreate,
    user: User = Depends(get_current_user),
    clip_repo: ClipRepository = Depends(get_clip_repository),
    db: AsyncSession = Depends(get_db),
) -> ClipResponse:
    service = CreateClipService(clip_repo, temporal_client)
    result = await service.execute(data, user.id)
    await db.commit()
    return ClipResponse.model_validate(result)
```
- Auth via `Depends(get_current_user)` — always present except public endpoints
- Status codes: `201` for creation, `204` for deletion
- Mutations call `await db.commit()` after service
- Response validation: `SchemaResponse.model_validate(orm_object)`
- **Never** raise domain exceptions in routes — that's the service's job

### Services
```python
class CreateClipService:
    def __init__(self, clip_repo: ClipRepository, temporal_client: Client):
        self.clip_repo = clip_repo
        self.temporal_client = temporal_client

    async def execute(self, data: ClipCreate, user_id: uuid.UUID) -> Clip:
        # validation, business logic, repository calls
        ...
        return clip
```
- Constructor receives repositories and clients as dependencies
- Single `execute()` method with typed parameters and return
- Raise domain exceptions (`ClipNotFoundException`, `InvalidTimestampsException`)
- Never commit — let the route handle transaction boundaries

### Repositories
```python
class ClipRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, clip_id: uuid.UUID) -> Clip | None:
        result = await self.session.execute(select(Clip).where(Clip.id == clip_id))
        return result.scalar_one_or_none()
```
- All methods are async
- Use `select()` queries (SQLAlchemy 2.0 style)
- `create()` calls `session.add()` + `session.flush()`
- List methods return `tuple[list[Model], int]` (items + total count)

### Models
```python
class Clip(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "clips"
    video_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("videos.id", ondelete="CASCADE"))
    status: Mapped[str] = mapped_column(String(20), default=ClipStatus.PENDING)
```

### Schemas
```python
class ClipResponse(BaseModel):
    id: uuid.UUID
    status: ClipStatus
    model_config = {"from_attributes": True}
```

### Enums
```python
class ClipStatus(StrEnum):
    PENDING = "pending"
    DOWNLOADING = "downloading"
```

### Exceptions
```python
class ClipNotFoundException(NotFoundException):
    def __init__(self, clip_id: str):
        super().__init__("Clip", clip_id)
```
Hierarchy: `AppException` → `NotFoundException` (404) / `ValidationException` (422) / `UnauthorizedException` (401) / `ForbiddenException` (403) / `ConflictException` (409)

### Cross-Module Rules
- **Modules never import from each other's routes or services** for direct calls
- Cross-module data access: pass the other module's `repository` as a dependency from the route into the service
- Long-running cross-module work: use Temporal workflows/activities
- Exception: `delete_video_service.py` queries clips for file cleanup before cascade delete

## Temporal (Async Processing)
- **Workflows** in `workflows.py` — orchestrate activities with retry policies
- **Activities** in `activities.py` — execute actual work (yt-dlp, ffmpeg)
- **Worker** in `worker.py` — separate process with `ThreadPoolExecutor(4)`
- Progress reported via heartbeat + JSON file in `CLIPS_BASE_DIR/{clip_id}/progress.json`

## Imports
- **All imports at the top of every file** — no inline/lazy imports inside functions
- Standard lib first, then third-party, then `app.*`

## Linting & Formatting
- **ruff** — line length 99, target Python 3.12, rules: E, F, I, W
- isort first-party: `"app"`

## Commands
```bash
# Run inside Docker container
make test-backend        # pytest
make migrate             # alembic upgrade head
make migration msg="..." # alembic revision --autogenerate
make seed                # python seed.py
```

## Testing
- pytest with `asyncio_mode = "auto"`
- Use `model_bakery` for fixtures, no mocks
- Test files live inside each module's `tests/` directory
- Fixture: `client` (async httpx.AsyncClient bound to app)
