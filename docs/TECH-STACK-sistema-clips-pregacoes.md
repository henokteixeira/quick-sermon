# Tech Stack — Sistema de Clips de Pregações

## Backend

| Tecnologia | Versão | Uso |
|---|---|---|
| Python | 3.12 | Linguagem principal |
| FastAPI | 0.111+ | Framework web e API REST |
| SQLAlchemy | 2.0 (async) | ORM |
| Alembic | 1.13+ | Migrations de banco de dados |
| PostgreSQL | 16 | Banco de dados principal |

## Processamento e Pipeline

| Tecnologia | Versão | Uso |
|---|---|---|
| Temporal | 1.24+ | Orquestração do pipeline de processamento |
| yt-dlp | latest | Download de vídeos do YouTube |
| FFmpeg | 6+ | Corte de vídeo |
| Ollama | latest | Servidor de LLM local (V1) |

## Frontend

| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js | 14 | Framework React (App Router) |
| Tailwind CSS | 3 | Estilização |
| shadcn/ui | latest | Componentes de UI (Dialog, Table, Toast, Form) |

## Integrações Externas

| Tecnologia | Uso |
|---|---|
| YouTube Data API v3 | Upload e publicação de vídeos |
| Gemini API / OpenAI API | Geração de conteúdo com LLM na nuvem (V2) |
| faster-whisper | Geração de legendas (V2) |

## Infraestrutura

| Tecnologia | Uso |
|---|---|
| Docker + Docker Compose | Containerização e orquestração local |
| Nginx | Reverse proxy |

## Autenticação e Segurança

| Tecnologia | Uso |
|---|---|
| JWT (HS256) | Autenticação de usuários |
| bcrypt | Hash de senhas |
| AES-256 | Criptografia de tokens OAuth |
