# Tech Stack — Sistema de Clips de Pregações

**Versão:** 2.0 | **Atualizado em:** 2026-04-24
**Status:** MVP (V1) em implementação avançada — reflete o stack efetivamente rodando em Docker.

## Backend

| Tecnologia | Versão | Uso |
|---|---|---|
| Python | 3.12 | Linguagem principal |
| FastAPI | 0.111+ | Framework web e API REST |
| SQLAlchemy | 2.0 (async) | ORM |
| Alembic | 1.13+ | Migrations de banco de dados |
| PostgreSQL | 16-alpine | Banco de dados principal (porta 5435) |
| Pydantic Settings | 2.0+ | Configuração tipada |
| structlog | 24.0+ | Logging estruturado |
| httpx | 0.27+ | Cliente HTTP assíncrono |
| asyncpg | 0.29+ | Driver Postgres async |

## Processamento e Pipeline

| Tecnologia | Versão | Uso |
|---|---|---|
| Temporal | 1.7+ (SDK) | Orquestração de workflows do pipeline (download/trim, detection, upload) |
| Temporal Server | auto-setup latest | Workflow engine (porta 7233/7234) |
| Temporal UI | latest | Debugging e inspeção de workflows (porta 8081) |
| Temporal DB | PostgreSQL 16-alpine | Banco dedicado do Temporal (porta 5436) |
| yt-dlp | latest | Download de vídeos do YouTube, extração de metadados/chapters/captions |
| yt-dlp-ejs | — | Runtime Node.js exigido pelo yt-dlp para JavaScript extraction do YouTube |
| FFmpeg | 6+ | Corte de vídeo (stream copy, sem reencoding) |

## Integrações Externas

| Tecnologia | Uso |
|---|---|
| YouTube Data API v3 | Upload, publicação, edição de privacy (`videos.update`), remoção (`videos.delete`) |
| google-api-python-client | 2.0+ | Cliente oficial da API do Google |
| google-auth-oauthlib | 1.0+ | OAuth 2.0 flow; scope **`youtube.force-ssl`** (necessário para publish + discard) |

## Autenticação e Segurança

| Tecnologia | Uso |
|---|---|
| JWT (HS256) | Access + refresh tokens |
| bcrypt | 4.0+ | Hash de senhas |
| cryptography | 43.0+ | AES-256 para tokens OAuth armazenados em `youtube_connections` |
| email-validator | 2.0+ | Validação de e-mail no registro |

## Frontend

| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js | 14.2 (App Router) | Framework React |
| React | 18 | Biblioteca UI |
| TypeScript | 5 (strict) | Tipagem |
| Tailwind CSS | 3.4 | Estilização via tokens CSS-vars |
| shadcn/ui + Radix UI | latest | Componentes base (Dialog, Table, AlertDialog, RadioGroup, Textarea, Toast) |
| TanStack Query | 5.91 | Server state (todas as queries REST) |
| Zustand | 5.0 | Client state (auth + notifications) |
| Axios | 1.13 | HTTP client com interceptors JWT |
| next-intl | 4.8 | Internacionalização (pt-BR) |
| lucide-react | latest | Ícones |
| sonner | latest | Toasts |
| use-debounce | latest | Auto-save debounced (rascunho de clip) |
| DM Serif Display | — | Font-family para headings (redesign v2) |

### Design System v2 (redesign PR #11)

- Paleta: `stone-950` (warm dark) + `amber-500` (accent)
- Dark mode default (`<html className="dark">`)
- Primitivos customizados em `components/features/ui/`: AmberGlow, MetricTile, Waveform (Mini/Large), StatusBadge, PipelineStrip, ClipsMap, DownloadMenu, Btn, Tab, InfoTile, FilterChip, AuthField, PasswordStrength, Logomark, StatusDot, PageTopbar, ThumbPlaceholder, VideoRow, Sparkline
- Sidebar fixa 220px (sem hover-expand)

## Infraestrutura

| Tecnologia | Uso |
|---|---|
| Docker + Docker Compose | Containerização e orquestração local |
| Nginx | Reverse proxy (porta 80) |
| Volumes | `db_data`, `temporal_db_data`, `clips_data`, `videos_data` |

### Serviços do docker-compose.yml

| Serviço | Porta | Descrição |
|---|---|---|
| `db` | 5435 | PostgreSQL principal |
| `temporal-db` | 5436 | PostgreSQL dedicado ao Temporal |
| `temporal` | 7233/7234 | Temporal server |
| `temporal-ui` | 8081 | UI de debugging do Temporal |
| `backend` | 8000 | FastAPI |
| `worker` | — | Worker Temporal (processa activities síncronas em ThreadPoolExecutor de 4 threads) |
| `frontend` | 3000 | Next.js |
| `nginx` | 80 | Reverse proxy |

## Tecnologias Reservadas para V2 (backlog)

| Tecnologia | Uso previsto | Issue |
|---|---|---|
| Whisper (local ou OpenAI API) | Refinamento de detecção de timestamps via transcrição amostrada | QS-75 |
| LLMs (OpenAI, Gemini) | Geração de títulos, descrições e mensagens WhatsApp | KAI-59 / KAI-60 / KAI-61 |
| silero-vad | VAD para fases de detecção | QS-75 (se viável) |
| faster-whisper | Legendas automáticas completas | V2 |

> **Nota:** `OPENAI_API_KEY` permanece em `app/core/config.py` como `str = ""` para reuso futuro (QS-75 e endpoints `POST /clips/{id}/regenerate/{field}` que hoje retornam `501 Not Implemented`).

## Observações Arquiteturais

- **Módulos backend nunca se importam entre si.** Cross-module communication acontece via Temporal activities.
- **Async SQLAlchemy obrigatório** — todas as rotas usam `AsyncSession`.
- **Routes thin:** validação + DI; lógica em services (uma classe por use case com `execute()`).
- **Tests:** pytest async com factory-boy, banco real (sem mocks de DB).
- **Comandos backend rodam dentro do Docker** (`docker compose exec backend ...`).
