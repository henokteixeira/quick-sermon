# Tech Spec — KAI-51: Submissao de URL e Validacao

## PRD: [KAI-51-submissao-url-validacao-prd.md](./KAI-51-submissao-url-validacao-prd.md)

---

## 1. Estado Atual

### O que ja existe (nao precisa criar)

| Componente | Arquivo | Status |
|---|---|---|
| Video model (SQLAlchemy) | `backend/app/modules/videos/models.py` | Completo |
| Video schemas (Pydantic) | `backend/app/modules/videos/schemas.py` | Completo |
| Video enums (VideoStatus) | `backend/app/modules/videos/enums.py` | Completo |
| Video exceptions | `backend/app/modules/videos/exceptions.py` | Completo |
| Video repository | `backend/app/modules/videos/repositories/video_repository.py` | Completo |
| Video dependencies | `backend/app/modules/videos/dependencies.py` | Completo |
| Frontend API functions | `frontend/lib/api/videos.ts` | Completo |
| Frontend types | `frontend/lib/types/video.ts` | Completo |
| Frontend pages (shell) | `frontend/app/(dashboard)/videos/` | Placeholder |
| Auth system (JWT, roles) | `backend/app/modules/auth/` | Completo |
| Auth guard (frontend) | `frontend/components/features/auth/auth-guard.tsx` | Completo |
| shadcn components (button, card, input, label, alert) | `frontend/components/ui/` | Completo |
| yt-dlp (Python package) | `backend/requirements.txt` | Instalado |
| httpx (HTTP client) | `backend/requirements.txt` | Instalado |

### O que precisa ser implementado

| # | Componente | Arquivo | Tipo |
|---|---|---|---|
| 1 | Alembic migration (videos table) | `backend/alembic/versions/002_create_videos_table.py` | Novo |
| 2 | YouTube URL validator | `backend/app/modules/videos/services/youtube_utils.py` | Novo |
| 3 | Fetch video metadata service | `backend/app/modules/videos/services/fetch_metadata_service.py` | Novo |
| 4 | Submit video service | `backend/app/modules/videos/services/submit_video_service.py` | Novo |
| 5 | List videos service | `backend/app/modules/videos/services/list_videos_service.py` | Novo |
| 6 | Get video service | `backend/app/modules/videos/services/get_video_service.py` | Novo |
| 7 | Video schemas (adicoes) | `backend/app/modules/videos/schemas.py` | Editar |
| 8 | Video routes | `backend/app/modules/videos/routes.py` | Reescrever |
| 9 | Register router in app | `backend/app/core/app.py` | Editar |
| 10 | VideoSubmitForm component | `frontend/components/features/videos/video-submit-form.tsx` | Novo |
| 11 | VideoListTable component | `frontend/components/features/videos/video-list-table.tsx` | Novo |
| 12 | VideoStatusBadge component | `frontend/components/features/videos/video-status-badge.tsx` | Novo |
| 13 | Videos page (list) | `frontend/app/(dashboard)/videos/page.tsx` | Reescrever |
| 14 | New video page | `frontend/app/(dashboard)/videos/new/page.tsx` | Reescrever |
| 15 | Video detail page | `frontend/app/(dashboard)/videos/[id]/page.tsx` | Reescrever |
| 16 | i18n translations (videos) | `frontend/messages/pt-BR.json` | Editar |
| 17 | shadcn components (table, badge, skeleton, dialog) | `frontend/components/ui/` | Gerar via CLI |

---

## 2. Backend — Detalhamento

### 2.1 Migration: Create Videos Table

Apenas os campos necessarios para KAI-51. Campos de timestamps, conteudo gerado e workflow serao adicionados em migrations futuras (KAI-58, KAI-59/60/61).

```sql
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_url VARCHAR(500) NOT NULL UNIQUE,
    title VARCHAR(255),
    duration INTEGER,
    thumbnail_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    youtube_video_id VARCHAR(50),
    submitted_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_videos_source_url ON videos (source_url);
CREATE INDEX ix_videos_status ON videos (status);
CREATE INDEX ix_videos_submitted_by ON videos (submitted_by);
```

Gerar via: `docker compose exec backend alembic revision --autogenerate -m "create_videos_table"`

### 2.2 YouTube URL Utilities

**Arquivo:** `backend/app/modules/videos/services/youtube_utils.py`

Funcoes utilitarias para validar e normalizar URLs do YouTube.

```python
import re

YOUTUBE_PATTERNS = [
    r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})',
    r'(?:https?://)?(?:www\.)?youtube\.com/live/([a-zA-Z0-9_-]{11})',
    r'(?:https?://)?youtu\.be/([a-zA-Z0-9_-]{11})',
]

def extract_video_id(url: str) -> str | None:
    """Extrai o video ID de uma URL do YouTube. Retorna None se invalida."""
    for pattern in YOUTUBE_PATTERNS:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def normalize_url(video_id: str) -> str:
    """Normaliza para formato canonico."""
    return f"https://www.youtube.com/watch?v={video_id}"
```

### 2.3 FetchMetadataService

**Arquivo:** `backend/app/modules/videos/services/fetch_metadata_service.py`

Usa yt-dlp em modo extract-info (sem download) para buscar metadados.

```python
class FetchMetadataService:
    async def execute(self, url: str) -> VideoMetadata:
        # Executa yt-dlp --dump-json --no-download em subprocess async
        # Retorna: title, duration (seconds), thumbnail_url
        # Raises VideoInaccessibleException se falhar
```

**Contrato de retorno (novo schema):**

```python
class VideoMetadata(BaseModel):
    video_id: str
    title: str
    duration: int       # segundos
    thumbnail_url: str
```

**Execucao:** Usa `asyncio.create_subprocess_exec` para rodar `yt-dlp --dump-json --no-download <url>` sem bloquear o event loop. Timeout de 15 segundos.

### 2.4 SubmitVideoService

**Arquivo:** `backend/app/modules/videos/services/submit_video_service.py`

```python
class SubmitVideoService:
    def __init__(self, video_repo: VideoRepository):
        self.video_repo = video_repo

    async def execute(self, data: VideoCreate, user_id: uuid.UUID) -> Video:
        # 1. Extrair video_id da URL
        video_id = extract_video_id(str(data.source_url))
        if not video_id:
            raise ValidationException("URL invalida. Cole um link do YouTube.")

        # 2. Normalizar URL
        normalized_url = normalize_url(video_id)

        # 3. Verificar duplicata
        existing = await self.video_repo.get_by_url(normalized_url)
        if existing:
            raise DuplicateVideoException(normalized_url)

        # 4. Buscar metadados via yt-dlp
        metadata_service = FetchMetadataService()
        metadata = await metadata_service.execute(normalized_url)

        # 5. Criar registro no banco
        video = Video(
            source_url=normalized_url,
            title=metadata.title,
            duration=metadata.duration,
            thumbnail_url=metadata.thumbnail_url,
            youtube_video_id=metadata.video_id,
            status=VideoStatus.PENDING,
            submitted_by=user_id,
        )
        return await self.video_repo.create(video)
```

### 2.5 ListVideosService

**Arquivo:** `backend/app/modules/videos/services/list_videos_service.py`

```python
class ListVideosService:
    def __init__(self, video_repo: VideoRepository):
        self.video_repo = video_repo

    async def execute(
        self, status: VideoStatus | None, page: int, page_size: int
    ) -> PaginatedResponse[VideoResponse]:
        offset = (page - 1) * page_size
        videos, total = await self.video_repo.list_all(
            status=status, offset=offset, limit=page_size
        )
        total_pages = (total + page_size - 1) // page_size
        return PaginatedResponse(
            items=[VideoResponse.model_validate(v) for v in videos],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
```

### 2.6 GetVideoService

**Arquivo:** `backend/app/modules/videos/services/get_video_service.py`

```python
class GetVideoService:
    def __init__(self, video_repo: VideoRepository):
        self.video_repo = video_repo

    async def execute(self, video_id: uuid.UUID) -> Video:
        video = await self.video_repo.get_by_id(video_id)
        if not video:
            raise VideoNotFoundException(str(video_id))
        return video
```

### 2.7 Video Routes

**Arquivo:** `backend/app/modules/videos/routes.py`

```python
router = APIRouter(prefix="/api/videos", tags=["videos"])

@router.post("/", response_model=VideoResponse, status_code=201)
async def submit_video(
    data: VideoCreate,
    user: User = Depends(get_current_user),
    video_repo: VideoRepository = Depends(get_video_repository),
    db: AsyncSession = Depends(get_db),
) -> VideoResponse:
    service = SubmitVideoService(video_repo)
    video = await service.execute(data, user.id)
    await db.commit()
    return VideoResponse.model_validate(video)

@router.get("/", response_model=PaginatedResponse[VideoResponse])
async def list_videos(
    status: VideoStatus | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(get_current_user),
    video_repo: VideoRepository = Depends(get_video_repository),
) -> PaginatedResponse[VideoResponse]:
    service = ListVideosService(video_repo)
    return await service.execute(status, page, page_size)

@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(
    video_id: uuid.UUID,
    user: User = Depends(get_current_user),
    video_repo: VideoRepository = Depends(get_video_repository),
) -> VideoResponse:
    service = GetVideoService(video_repo)
    video = await service.execute(video_id)
    return VideoResponse.model_validate(video)
```

### 2.8 Schemas (adicoes)

Adicionar ao `schemas.py`:

```python
class VideoMetadata(BaseModel):
    video_id: str
    title: str
    duration: int
    thumbnail_url: str

class VideoInaccessibleException(ValidationException):
    def __init__(self, message: str = "Video inacessivel"):
        super().__init__(message)
```

---

## 3. Frontend — Detalhamento

### 3.1 shadcn Components (gerar via CLI)

```bash
npx shadcn@latest add table badge skeleton dialog
```

### 3.2 VideoStatusBadge

**Arquivo:** `frontend/components/features/videos/video-status-badge.tsx`

Componente que renderiza badge colorido por status:

| Status | Cor | Label |
|---|---|---|
| pending | yellow | Aguardando |
| detecting | blue | Detectando |
| processing | blue | Processando |
| awaiting_review | purple | Revisao |
| published | green | Publicado |
| error | red | Erro |

### 3.3 VideoSubmitForm

**Arquivo:** `frontend/components/features/videos/video-submit-form.tsx`

Fluxo do formulario:
1. Editor cola URL no campo de texto
2. Validacao client-side: regex dos 3 formatos aceitos
3. Botao "Processar" habilitado apenas se URL valida
4. Ao submeter: chama `createVideo(url)` via React Query mutation
5. Loading state com skeleton/spinner
6. **Sucesso:** redireciona para `/videos/{id}`
7. **Erro 409 (duplicata):** exibe mensagem com link para video existente
8. **Erro 422 (URL invalida / inacessivel):** exibe mensagem de erro

**Estado do componente:**
- `url`: string (controlled input)
- `isValid`: boolean (regex validation)
- `mutation`: useMutation do React Query

### 3.4 VideoListTable

**Arquivo:** `frontend/components/features/videos/video-list-table.tsx`

- Usa `useQuery` para buscar lista de videos
- Tabela com colunas: Thumbnail, Titulo, Status (badge), Data, Acoes
- Paginacao com botoes Anterior/Proximo
- Link para `/videos/{id}` ao clicar na linha
- Botao "Novo Video" no header que linka para `/videos/new`

### 3.5 Video Detail Page

**Arquivo:** `frontend/app/(dashboard)/videos/[id]/page.tsx`

- Busca video por ID via `useQuery`
- Exibe: thumbnail grande, titulo, duracao formatada, status badge, URL original, data de submissao
- Loading state com skeleton

### 3.6 i18n — Novas chaves

Adicionar ao `messages/pt-BR.json`:

```json
{
  "videos": {
    "title": "Videos",
    "newVideo": "Novo Video",
    "submit": {
      "title": "Submeter Video",
      "subtitle": "Cole a URL de uma live do YouTube para iniciar o processamento",
      "urlLabel": "URL do YouTube",
      "urlPlaceholder": "https://youtube.com/watch?v=...",
      "submit": "Processar",
      "submitting": "Validando...",
      "invalidUrl": "URL invalida. Cole um link do YouTube.",
      "duplicate": "Este video ja foi submetido.",
      "viewExisting": "Ver video existente",
      "inaccessible": "Video inacessivel. Verifique se o link esta correto.",
      "shortVideo": "Video muito curto para conter uma pregacao — deseja continuar?",
      "success": "Video submetido com sucesso!"
    },
    "list": {
      "thumbnail": "Thumb",
      "videoTitle": "Titulo",
      "status": "Status",
      "date": "Data",
      "noVideos": "Nenhum video submetido ainda.",
      "previous": "Anterior",
      "next": "Proximo"
    },
    "detail": {
      "title": "Detalhes do Video",
      "sourceUrl": "URL Original",
      "duration": "Duracao",
      "submittedAt": "Submetido em",
      "status": "Status"
    },
    "status": {
      "pending": "Aguardando",
      "detecting": "Detectando",
      "processing": "Processando",
      "awaiting_review": "Revisao",
      "published": "Publicado",
      "error": "Erro"
    }
  }
}
```

---

## 4. Ordem de Implementacao

```
1. Migration (videos table)
   |
2. YouTube URL utils + FetchMetadataService
   |
3. SubmitVideoService + ListVideosService + GetVideoService
   |
4. Video routes (rewrite) + register router in app.py
   |
5. shadcn components (table, badge, skeleton, dialog)
   |
6. i18n translations
   |
7. VideoStatusBadge + VideoSubmitForm + VideoListTable
   |
8. Pages (videos list, new video, video detail)
```

---

## 5. Plano de Testes

### Backend

| Teste | Tipo | Descricao |
|---|---|---|
| `POST /api/videos` com URL valida | Integration | Retorna 201 + video com metadados |
| `POST /api/videos` com URL duplicada | Integration | Retorna 409 |
| `POST /api/videos` com URL invalida | Integration | Retorna 422 |
| `POST /api/videos` sem auth | Integration | Retorna 401 |
| `GET /api/videos` | Integration | Retorna lista paginada |
| `GET /api/videos/{id}` | Integration | Retorna video |
| `GET /api/videos/{id}` nao existe | Integration | Retorna 404 |
| `extract_video_id()` | Unit | Testa os 3 formatos de URL |
| `normalize_url()` | Unit | Testa normalizacao |

### Frontend

| Teste | Tipo | Descricao |
|---|---|---|
| VideoSubmitForm renderiza | Component | Campos e botao presentes |
| Validacao de URL client-side | Component | Botao habilitado/desabilitado |
| VideoListTable renderiza | Component | Tabela com dados mockados |
| TypeScript compila | Build | `npx tsc --noEmit` sem erros |

---

## 6. API Contracts

### POST /api/videos

**Request:**
```json
{
  "source_url": "https://www.youtube.com/watch?v=abc123def45"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "source_url": "https://www.youtube.com/watch?v=abc123def45",
  "title": "Culto de Domingo - Igreja XYZ",
  "duration": 5400,
  "thumbnail_url": "https://i.ytimg.com/vi/abc123def45/maxresdefault.jpg",
  "status": "pending",
  "youtube_video_id": "abc123def45",
  "sermon_start": null,
  "sermon_end": null,
  "confidence": null,
  "selected_title": null,
  "created_at": "2026-03-22T10:00:00Z"
}
```

**Response 409 (duplicata):**
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Video with URL 'https://...' has already been submitted",
    "details": null,
    "timestamp": "2026-03-22T10:00:00Z"
  }
}
```

**Response 422 (URL invalida):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "URL invalida. Cole um link do YouTube.",
    "details": null,
    "timestamp": "2026-03-22T10:00:00Z"
  }
}
```

### GET /api/videos?page=1&page_size=20&status=pending

**Response 200:**
```json
{
  "items": [
    { "id": "uuid", "source_url": "...", "title": "...", "status": "pending", "created_at": "..." }
  ],
  "total": 42,
  "page": 1,
  "page_size": 20,
  "total_pages": 3
}
```

### GET /api/videos/{id}

**Response 200:** Mesmo formato de VideoResponse.

**Response 404:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Video 'uuid' not found",
    "details": null,
    "timestamp": "2026-03-22T10:00:00Z"
  }
}
```
