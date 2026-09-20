# Quick Sermon — Sistema de Clips de Pregações

![CI](https://github.com/henokteixeira/quick-sermon/actions/workflows/ci.yml/badge.svg)

Plataforma web que automatiza o pipeline de processamento de vídeos de pregações: da URL da Live até o vídeo publicado no YouTube. A Detecção de Trechos Sugeridos usa Capítulos e Legendas do próprio vídeo, sem IA (ver `docs/adr/`).

## Tech Stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0 (async), Alembic, PostgreSQL 16
- **Pipeline:** Temporal, yt-dlp, FFmpeg
- **Frontend:** Next.js 14 (App Router), Tailwind CSS, shadcn/ui
- **Infra:** Docker Compose, Nginx

## Pré-requisitos

- Docker e Docker Compose v2 (comando `docker compose`, não `docker-compose`).
- `openssl` disponível no PATH (usado por `make setup` para gerar segredos).
- Estas portas do host livres: **80, 3000, 8000, 8081, 5435, 5436, 7234**. Se alguma estiver ocupada, o serviço correspondente não sobe e o erro ("port is already allocated") aparece no output de `make up`; descubra o processo com `lsof -i :<porta>` (ou `sudo lsof -i :<porta>`) e pare-o antes de repetir `make up`.

## Subindo

```bash
# Gera o .env com segredos aleatórios (só na primeira vez; não sobrescreve um .env existente)
make setup

# Sobe todos os serviços; migrations e seed do Admin rodam automaticamente no arranque
make up
```

`make migrate` e `make seed` continuam existindo para uso manual, mas não são passos obrigatórios.

Para saber se a subida terminou, `http://localhost/health` responde `{"status": "ok"}` quando há conexão com o banco, ou `{"status": "degraded"}` quando não há. Responder `ok` não prova que as migrations já rodaram — só que o backend está de pé e fala com o Postgres.

## Entrando

O `make setup` imprime, uma única vez, o email e a senha do usuário Admin criado pelo seed (também ficam em `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` no `.env`, se precisar consultar depois). Entre em `http://localhost` com essas credenciais; a chamada por trás é `POST /api/auth/login`.

Cadastro aberto (`POST /api/auth/register`) sempre cria um **Editor**. Só o **Admin** Publica e Descarta Clips e conecta ou desconecta um Canal; o Editor cria, edita e faz a Revisão dos Clips.

## Primeiro vídeo

1. Envie a URL de uma Live pública do YouTube.
2. Aguarde a Detecção rodar; ela usa Capítulos e Legendas do vídeo para propor Trechos Sugeridos.
3. Escolha um Trecho Sugerido (ou ajuste os tempos à mão) e crie um Clip.
4. Baixe o Clip processado. Até aqui, nada exige Cookies do YouTube nem Canal Conectado.

## Cookies do YouTube

Alguns vídeos são bloqueados pelo YouTube com "Sign in to confirm you're not a bot"; o `yt-dlp` contorna isso com cookies exportados de uma conta Google. O arquivo é **opcional** — sem ele, vídeos não bloqueados continuam funcionando normalmente. O guia completo, com o passo a passo de exportação e rotação, está em `secrets/README.md`.

## Publicar no YouTube (opcional)

Fazer Upload, Publicar e Descartar exige um Canal Conectado, que por sua vez exige:

1. Um projeto no Google Cloud com a YouTube Data API v3 ativada.
2. Um cliente OAuth do tipo **Web**, com uma URI de redirecionamento local.
3. Preencher `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET` e `YOUTUBE_OAUTH_ENCRYPTION_KEY` no `.env` (a última já vem preenchida por `make setup`).

Sem isso, tudo até o Download do Clip funciona; só Upload, Publicar e Descartar ficam de fora.

## O que não está no MVP

- Geração de título, descrição e mensagem de WhatsApp por IA: os três botões "Regenerar" existem na interface mas estão desabilitados.
- Notificações.
- Gestão de equipe (convidar, remover ou trocar o papel de outro usuário pela interface).
- Qualquer uso de IA na Detecção: ela é inteiramente baseada em Capítulos e Legendas.

## Problemas comuns

- **`make up` sobe mas o backend nunca fica saudável:** alguma das portas do host (veja Pré-requisitos) está ocupada por outro processo ou projeto; `make down`, libere a porta e repita `make up`.
- **Login falha com credenciais inválidas:** a senha do Admin só é impressa uma vez por `make setup`; confira `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` no `.env`.
- **Vídeo trava no Download com erro de bot:** exporte os Cookies do YouTube (seção acima).
- **`make setup` diz que o `.env` já existe e não muda nada:** é proposital — apague o `.env` manualmente se quiser gerar segredos novos.

## Comandos do dia a dia

```bash
make up-dev        # sobe com hot reload
make test-backend  # roda os testes do backend
make logs          # segue os logs de todos os serviços
make down          # derruba o stack
make help          # lista todos os alvos do Makefile
```

## Decisões e glossário

Termos do domínio (Live, Detecção, Trecho Sugerido, Clip, etc.) estão em `CONTEXT.md`. Decisões técnicas e de arquitetura, com o porquê, estão em `docs/adr/`.
