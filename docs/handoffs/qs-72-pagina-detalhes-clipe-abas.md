# Handoff: Continuar KAI-55 (PR #8) e começar QS-72 (remodelagem em abas)

**Data:** 2026-04-18
**Status:** KAI-55 aguardando merge; QS-72 pronta pra começar

## 1. Objetivo

Dois trabalhos encadeados:
- **KAI-55 (PR #8)** — interface de revisão e publicação: merge pendente; aguarda teste manual com YouTube reconectado (scope novo) e a decisão de mergear.
- **QS-72 (nova task)** — remodelar click-no-clipe pra abrir uma página de detalhes com abas (Edição, Processamento, Revisão), unificar UX e cobrir estados published/discarded. Todas as decisões de design já foram fechadas na grilling.

## 2. Contexto essencial

### Stack
- Backend: Python 3.12 + FastAPI + SQLAlchemy 2.0 async + Alembic + Temporal + Pydantic v2
- Frontend: Next.js 14 App Router + shadcn/ui + TanStack Query v5 + Zustand + next-intl (pt-BR) + sonner
- Infra: Docker Compose (db PostgreSQL, temporal-db, temporal, backend, worker, frontend, nginx, ollama)

### Decisões-chave (KAI-55 já implementado)
- Novos estados `awaiting_review` e `discarded` no `ClipStatus`
- Upload termina em `awaiting_review`, não `published` (workflow mudou)
- OAuth YouTube agora usa scope `youtube.force-ssl` (antes era `youtube.upload`) — necessário pra `videos.update` (publish) e `videos.delete` (discard)
- `editor` pode editar drafts + disparar upload; `admin` pode publicar e descartar (guards via `require_role`)
- Regenerate IA (KAI-59/60/61) retorna 501 — frontend mostra placeholder

### Decisões-chave (QS-72 — fechadas na grilling)
- Click no card do clipe navega pra `/videos/[id]/clip/[clipId]?tab=edicao|processamento|revisao`
- `ClipPlayerDialog` (modal) é removido
- 3 abas sempre navegáveis; default tab depende do status
- Aba Edição = read-only sempre (re-edição = criar novo clip)
- Aba Processamento = Download · Trim · Upload YouTube com histórico + timestamps, polling React Query, retry inline em erro
- Aba Revisão = herda componentes do KAI-55
- Player só na aba Revisão; fallback local (`stream-url`) se não tem `youtube_video_id` ainda
- Descarte permitido em qualquer status exceto `published`; durante pipeline ativo, cancela workflow Temporal antes
- Clip-list card só com Baixar + Excluir; card inteiro clicável
- Header: `selected_title || "Clip HH:MM:SS–HH:MM:SS"`, meta = duração + data criação + views YouTube quando published

## 3. O que já foi feito

### KAI-55 — implementação completa (5 commits)
1. `6822aec feat(clips): add awaiting_review/discarded states and review data model (KAI-55)`
   - Migration `e6a0f4c18d92_add_review_fields_to_clips.py` — 8 colunas novas
   - `enums.py` — AWAITING_REVIEW, DISCARDED
   - `models.py` — generated_titles (JSONB), generated_description, generated_whatsapp_message, selected_title, description, whatsapp_message, published_at, discarded_at
   - `workflows.py` — transição final `AWAITING_REVIEW`
2. `301678a feat(clips): add review/publish/discard endpoints and services (KAI-55)`
   - Services: `publish_clip_service`, `discard_clip_service`, `save_clip_draft_service`, `get_clip_review_service`
   - Endpoints: `GET /review`, `PATCH /draft`, `POST /publish`, `POST /discard`, `POST /regenerate/{field}` (501)
   - Activities helpers síncronos `update_youtube_privacy`, `delete_youtube_video` (chamadas via `asyncio.to_thread`)
   - 25 testes pytest passando (mocks com `AsyncMock` seguindo padrão existente)
3. `d559364 fix(youtube): expand OAuth scope to force-ssl for publish/discard (KAI-55)`
   - Trocou de `youtube.upload+readonly` pra `youtube.force-ssl`
   - Erro `insufficientPermissions` mapeado pra `YouTubeInsufficientScopeException` (code `YOUTUBE_INSUFFICIENT_SCOPE`)
4. `1cb223c feat(review): add clip review UI with player and draft autosave (KAI-55)`
   - Rota `/videos/[id]/clip/[clipId]/review` + 9 componentes em `components/features/review/`
   - Hook `use-clip-autosave` (debounce 1s + flush síncrono antes de publish)
   - `clip-list.tsx`: renomeou Upload → "Enviar pra revisão", adicionou "Baixar arquivo" e "Revisar", novos status badges
   - sonner instalado + `<Toaster />` no root layout
   - shadcn primitives: alert-dialog, radio-group, textarea
   - i18n completo em `messages/pt-BR.json`
5. `950f338 chore(docker): enable frontend hot-reload in dev compose`
   - Override no `docker-compose.dev.yml` pra frontend com volume mount e `npm run dev`

### PR #8
- Aberto em https://github.com/henokteixeira/quick-sermon/pull/8
- Branch: `henok/kai-55-interface-de-revisao-e-publicacao`
- Title: "feat: clip review and publish workflow (KAI-55)"
- Body com test plan completo
- ✅ tsc sem erros, ESLint só warnings pré-existentes, pytest 32/32 passando

### Design iterações (user feedback que foi incorporado)
- Primeira versão: full-bleed 3 colunas + breadcrumb + painel lateral grande
- User pediu pra alinhar com outras telas → `max-w-[960px]` (igual video detail), link "Voltar" simples (sem breadcrumb)
- User pediu compactação → padding reduzido nos cards de editor (px-4 py-3 header, px-4 py-4 content)
- Layout final: 2 colunas lg:grid-cols-[minmax(0,1fr)_300px], centro = 3 cards editor, direita = player + DetailsCard compacto

### QS-72 criada (decisões já capturadas)
- URL: https://linear.app/kairon-tech/issue/QS-72/remodelagem-pagina-de-detalhes-do-clipe-com-abas-edicao-processamento
- Branch sugerida: `henok/qs-72-remodelagem-pagina-de-detalhes-do-clipe-com-abas-edicao`
- Relacionada a KAI-55
- Description completa com 14 critérios de aceite, escopo, dependências, constraints

## 4. Estado atual

### Local dev
- Docker Compose rodando em dev mode: `make up-dev`
- Frontend hot-reload funcionando (http://localhost:3000)
- Backend `--reload` funcionando (http://localhost:8000, http://localhost/api)
- Migration `e6a0f4c18d92` aplicada; schema do `clips` com as 8 colunas novas
- DB user admin seeded: `admin@quicksermon.com` / `admin123456`

### Funcional
- Fluxo end-to-end funcionando até o click em "Publicar"
- Publish falha com `YOUTUBE_INSUFFICIENT_SCOPE` porque o token OAuth foi obtido antes da mudança de scope → user precisa **desconectar e reconectar o canal YouTube em Configurações**
- Depois de reconectar, publish deve funcionar (videos.update com `privacyStatus=public`)
- Discard idem — delete requer o scope novo

### Pendências
- Teste manual end-to-end com YouTube reconectado
- Merge do PR #8 pela via que o user escolher (não foi executado automaticamente — é ação compartilhada/irreversível)
- Implementação de QS-72 ainda não começou

## 5. Próximos passos

### Imediatos (fechar KAI-55)
1. **User reconecta YouTube**: vai em Configurações → desconectar → conectar → autorizar novo scope (youtube.force-ssl)
2. Testar fluxo real:
   - Criar clip → `ready`
   - "Enviar pra revisão" → upload vira `awaiting_review`
   - Abrir /review, editar campos, ver autosave toast
   - Como admin: clicar "Publicar" → modal confirma → video vira público no YouTube
   - Banner "Publicado" com link + copiar WhatsApp habilitado
3. Se passar: mergear PR #8 (squash merge recomendado)
4. Verificar que branch `main` está OK após merge

### Começar QS-72
1. Criar branch: `git checkout main && git pull && git checkout -b henok/qs-72-remodelagem-pagina-de-detalhes-do-clipe-com-abas-edicao`
2. Ler QS-72 completa no Linear (todas decisões estão lá)
3. Ordem sugerida de implementação:
   - **(a)** Criar página shell `/videos/[id]/clip/[clipId]/page.tsx` com tabs (Tabs shadcn ou custom)
   - **(b)** Mover lógica de `/review/page.tsx` pra aba Revisão, criar redirect da rota antiga
   - **(c)** Implementar aba Edição (read-only): timeline + start/end + quality — reusa componentes de `clip-editor`
   - **(d)** Implementar aba Processamento: timeline de etapas, polling, retry button, histórico com timestamps
   - **(e)** Backend: endpoint pra retornar progresso histórico (quando cada etapa completou) + adicionar `discard_during_active_pipeline` que cancela workflow Temporal
   - **(f)** Remover `ClipPlayerDialog` e todas referências
   - **(g)** Atualizar `clip-list.tsx` — card clicável, só Baixar + Excluir
   - **(h)** Header com título/meta conforme decisões
   - **(i)** Views YouTube (lazy, opcional) — novo endpoint `GET /api/clips/{id}/youtube-stats` que chama `videos.list part=statistics`
4. Testes: reusar padrão de KAI-55 (pytest + AsyncMock)

## 6. Perguntas em aberto

- **Workflow cancelation**: o clip guarda o `workflow_id`? Se não, `discard_clip_service` vai precisar de convenção de naming (ex: `clip-{clip_id}` e `youtube-upload-{upload_id}` — ver `trigger_upload_service` e `create_clip_service` pra confirmar nomes exatos).
- **Progresso histórico**: hoje `progress.json` é sobrescrito a cada etapa. Pra mostrar linha do tempo, precisa persistir os timestamps de conclusão em outro lugar (nova tabela `clip_pipeline_events`? Campos no próprio `clips`? — decisão aberta).
- **Views YouTube**: ainda não há endpoint. Desejavel mas não crítico pro primeiro release.
- **Views cache**: se implementado, cachear por 5min? Por hora? Evitar queima de quota.
- **Merge do PR #8**: user decide quando/como (pode pedir pra agente tentar via `gh pr merge` se quiser).

## 7. Artefatos relevantes

### Arquivos-chave modificados no KAI-55
- **Backend (modificar)**:
  - `backend/app/modules/clips/enums.py` (adicionar novos estados pra QS-72 se necessário)
  - `backend/app/modules/clips/routes.py` (novo endpoint progresso histórico?)
  - `backend/app/modules/clips/services/discard_clip_service.py` (adicionar cancel workflow Temporal)
- **Backend (criados)**:
  - `backend/alembic/versions/e6a0f4c18d92_add_review_fields_to_clips.py`
  - `backend/app/modules/clips/services/{publish,discard,save_clip_draft,get_clip_review}_service.py`
  - `backend/app/modules/clips/tests/test_{publish,discard,save_clip_draft,get_clip_review}_service.py`
- **Frontend (criados — reusar em QS-72)**:
  - `frontend/components/features/review/*` — 9 componentes, todos reusáveis na aba Revisão
  - `frontend/lib/hooks/use-clip-autosave.ts`
  - `frontend/lib/api/clips.ts` — já tem `getClipReview`, `saveClipDraft`, `publishClip`, `discardClip`, `regenerateField`

### Comandos úteis
```bash
# Dev
make up-dev                           # sobe stack em dev (hot reload frontend + backend)
make logs-backend                     # logs backend + worker
make migrate                          # alembic upgrade head
make test-backend                     # pytest -v
cd frontend && npm run dev            # frontend standalone
cd frontend && npx tsc --noEmit       # type check
cd frontend && npm run lint           # ESLint

# Git/PR
gh pr view 8 --web                    # abre PR #8 no browser
gh pr merge 8 --squash --delete-branch # mergear KAI-55 (quando aprovado)
```

### Referências Linear
- [KAI-55](https://linear.app/kairon-tech/issue/KAI-55/interface-de-revisao-e-publicacao) (parent — em implementação)
- [QS-72](https://linear.app/kairon-tech/issue/QS-72/remodelagem-pagina-de-detalhes-do-clipe-com-abas-edicao-processamento) (novo — pendente)
- [KAI-63](https://linear.app/kairon-tech/issue/KAI-63/) — SSE/WebSocket (fora do escopo de QS-72)
- KAI-59/60/61 — Geração IA (títulos/descrição/WhatsApp) — fora do escopo

### Handoffs anteriores
- `docs/handoffs/kai-55-interface-revisao-publicacao.md` — documento que iniciou essa task

## 8. Instruções pra próxima sessão

### Preferências do user (das memories)
- **Docker obrigatório pra backend** — não rodar Python local (exceto rodar testes rapidamente no venv, mas preferir Docker)
- **Testes sem mocks**: o padrão real do projeto usa `AsyncMock` apesar do CLAUDE.md dizer "model_bakery" — usar `AsyncMock` é aceito (seguir o que está em `test_get_quota_service.py`)
- **Design system obrigatório** — usar frontend-design skill pra novas telas; não inventar visual
- **Linear**: nunca marcar Done manualmente — branch/PR auto-fecha
- **Portuguese BR em toda comunicação** com diacríticos corretos

### Armadilhas conhecidas
- **Porta 5435 do DB** pode conflitar com outros projetos locais (ex: maria_postgres) — usar override apenas se necessário
- **Frontend em prod mode** não tem hot reload; o override dev já está commitado
- **Scope OAuth YouTube**: se mudar pra outro scope, TEM que reconectar o canal (token antigo não basta)
- **Workflow cancelation**: não testei `temporal_client.get_workflow_handle(...).cancel()` em produção — pode ter edge case com retry policies já em andamento
- **Permissões no frontend**: NUNCA confiar só em `disabled`/ocultar botão — backend é autoritativo (já está com `require_role`)
- **I18n**: adicionar strings em `messages/pt-BR.json` antes de referenciar via `t()` ou dará runtime error

### Tom
- Conciso, direto, sem floreio
- Respostas ≤100 palavras exceto quando a task exigir
- Ações pequenas e reversíveis: ok sem pedir
- Ações destrutivas/compartilhadas (push force, merge, delete branch, drop data): pedir confirmação
- Parallelizar ferramentas quando independentes

### Contexto de sessão
- Auto mode estava ativo — assumir execução autônoma quando a tarefa for clara
- User prefere plan mode pra tasks grandes (QS-72 vai querer plan antes)
- User valida UI visualmente — quando mudar layout/visual, avisar que precisa dar F5 e dar screenshot path se aplicável
