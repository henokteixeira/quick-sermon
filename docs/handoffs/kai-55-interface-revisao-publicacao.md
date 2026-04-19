# Handoff: Implementação da KAI-55 — Interface de Revisão e Publicação

**Data:** 2026-04-18
**Status:** Aguardando início da implementação (design fechado, pronto para codar)
**Issue Linear:** [KAI-55](https://linear.app/kairon-tech/issue/KAI-55/interface-de-revisao-e-publicacao)
**Branch sugerida:** `henok/kai-55-interface-de-revisao-e-publicacao`

## 1. Objetivo

Implementar a tela de revisão e publicação de clips de pregação — último gate antes do vídeo virar público no YouTube. Editor/admin abre um clip que já está no YouTube como `unlisted`, edita título/descrição/mensagem de WhatsApp (pré-preenchidos pela IA ou manuais), e admin clica "Publicar" para mudar privacy → `public`. A KAI-55 é a peça que fecha o pipeline end-to-end do MVP (Fase 1).

## 2. Contexto essencial

### Stack
- **Backend:** Python 3.12 + FastAPI, SQLAlchemy 2.0 async, Alembic, Pydantic v2, Temporal workflows
- **Frontend:** Next.js 14 App Router, shadcn/ui, Tailwind, React Query (server), Zustand (auth)
- **Integrações:** YouTube Data API v3 (OAuth2 já implementado em KAI-54)

### Decisões arquiteturais já tomadas (vêm do CLAUDE.md e da grilling session)
- Módulos backend são self-contained em `app/modules/`; nunca importam uns dos outros (comunicação via Temporal activities)
- Routes thin: validação + DI, lógica em services (uma classe por use case com `execute()`)
- Frontend: feature components agrupados por domínio em `components/features/`
- Erros nunca bloqueiam o fluxo — sempre fallback manual

### Dependências já resolvidas (não bloqueiam)
- **KAI-54** (Upload YouTube) ✅ — OAuth2, upload activity, quota tracking
- **KAI-57** (Auth + roles) ✅ — roles `editor` e `admin` com `require_role(UserRole.ADMIN)` disponível
- **KAI-52** (Download + corte) ✅

### Dependências **não resolvidas** (mas não bloqueiam o KAI-55 — tela tem que ser resiliente à ausência)
- **KAI-59** (Geração de títulos IA)
- **KAI-60** (Geração de descrição IA, inclui hashtags dentro da descrição)
- **KAI-61** (Geração de mensagem WhatsApp IA)

## 3. O que já foi feito

### Grilling session concluída (17 decisões capturadas)
Todas persistidas na descrição da KAI-55 no Linear. Resumo das decisões-chave:

1. **Upload é manual** via botão "Enviar pra revisão" no clip-list (renomeia o botão "Upload" atual). Permite baixar arquivo local antes de subir.
2. **Privacidade do upload: `unlisted`** (hoje está `private` no código — precisa reverter).
3. **Novo estado `awaiting_review`** entre `uploading` e `published`. `published` = público no YouTube.
4. **Novo estado `discarded`** no enum.
5. **URL da tela:** `/videos/[videoId]/clip/[clipId]/review`
6. **Entry point:** botão "Revisar" em `clip-list.tsx` quando clip está `awaiting_review`.
7. **Layout:** split-view desktop (player YouTube sticky 60% esquerda, painel edição 40% direita), stack em mobile. Referência: YouTube Studio.
8. **Seletor de título:** radio group vertical (5 opções IA + "Escrever manualmente"), contador de chars, botão "Regenerar".
9. **Editor de descrição:** textarea plain text, auto-resize, contador ≤5000, botão "Regenerar" com confirmação se editado.
10. **Mensagem WhatsApp:** textarea, botão "Regenerar", botão "Copiar" desabilitado até publicar.
11. **Rascunho:** campos no próprio `clips` (read-only IA + editáveis user), auto-save debounce ~1s.
12. **Publicar:** modal `AlertDialog` com preview (título + 2 linhas descrição), flush síncrono do último save antes de publicar.
13. **Validação pra habilitar Publicar:** título selecionado + descrição preenchida + ambos dentro dos limites.
14. **Pós-publicação:** mesma URL vira read-only, banner "✓ Publicado" com link + copiar + "Copiar WhatsApp" habilitado.
15. **Descartar clip:** soft delete (`discarded`), remove do YouTube, só em `awaiting_review`.
16. **Permissões:**
    - `editor`: abrir tela, editar conteúdo, regenerar
    - `admin`: tudo do editor + **publicar** + **descartar**
17. **Tratamento de erros no modal:** 401 (refresh/reconectar), 403 quota (mensagem genérica), 404 (descartar?), 5xx/timeout (retry 1x).

### Decisões explicitamente fora do escopo (criar issue separada se virar necessidade)
- Tags do YouTube (metadata separado das hashtags da descrição)
- Edição pós-publicação (alterar título/descrição de vídeo já público)
- Despublicar (tornar vídeo público em unlisted/privado)
- Inbox global `/review` cross-video
- SSE/WebSocket pra notificações (reservado pra KAI-63)
- Cleanup automático de arquivos locais

## 4. Estado atual

### Código
- **Backend:** nenhuma alteração iniciada pra KAI-55 ainda. Módulos `clips`, `youtube`, `users` existem e funcionam.
- **Frontend:** stub `/videos/[id]/review` existe mas está vazio (TODO comment). `clip-list.tsx` tem botão "Upload" atual que precisa ser renomeado/ajustado.

### Pendências técnicas identificadas na grilling
- Código atual sobe clips como `private` — precisa voltar pra `unlisted` (embed depende disso)
- Módulo `content` existe só como schemas Pydantic (vazio de implementação) — KAI-59/60/61 vão preencher
- Pasta `frontend/components/features/review/` está vazia

### Critérios de aceite (16 itens objetivos)
Ver seção "Critérios de Aceite" na descrição da KAI-55 no Linear. Servem como roteiro de implementação.

## 5. Próximos passos

Ordem sugerida (tracer-bullet vertical slice):

### Fase A — Backend base
1. **Alembic migration** adicionando:
   - Enum status: novos valores `awaiting_review`, `discarded` (manter os existentes)
   - Colunas no `clips`:
     - `generated_titles` (JSONB, nullable)
     - `generated_description` (TEXT, nullable)
     - `generated_whatsapp_message` (TEXT, nullable)
     - `selected_title` (VARCHAR(100), nullable)
     - `description` (TEXT, nullable)
     - `whatsapp_message` (TEXT, nullable)
     - `published_at` (TIMESTAMP, nullable)
     - `discarded_at` (TIMESTAMP, nullable)
2. **Atualizar enum Python** em `backend/app/modules/clips/enums.py` com `AWAITING_REVIEW` e `DISCARDED`.
3. **Reverter privacy do upload** de `private` → `unlisted` no módulo `youtube` (buscar onde foi mudado no KAI-54).
4. **Ajustar workflow de upload** pra transicionar clip pra `awaiting_review` ao invés de `published` ao terminar.
5. **Novos endpoints** em `backend/app/modules/clips/routes.py`:
   - `GET /api/clips/{id}/review` — retorna todos os dados necessários pra tela (clip + generated_* + selected_*)
   - `PATCH /api/clips/{id}/draft` — salvar rascunho (auto-save): recebe qualquer combinação de `selected_title`, `description`, `whatsapp_message`
   - `POST /api/clips/{id}/publish` — muda privacy YouTube → `public`, transiciona status, guards `require_role(UserRole.ADMIN)`
   - `POST /api/clips/{id}/discard` — soft delete + remove do YouTube, guards `require_role(UserRole.ADMIN)`, só permite se `status == awaiting_review`
   - `POST /api/clips/{id}/regenerate/{field}` — dispara regeneração (stub por enquanto, se KAI-59/60/61 não estão prontos: retorna 501 Not Implemented ou placeholder). `field` ∈ `titles | description | whatsapp_message`
6. **Services por use case** (padrão do projeto):
   - `publish_clip_service.py` — orquestra a mudança de privacy + transition de status
   - `discard_clip_service.py` — orquestra delete YouTube + soft delete
   - `save_clip_draft_service.py` — atualiza campos editáveis
7. **Testes pytest async com model_bakery** (seguir padrão existente — sem mocks, usar DB real).

### Fase B — Frontend base
8. **Renomear botão "Upload"** em `clip-list.tsx` pra "Enviar pra revisão". Adicionar botão "Baixar arquivo" ao lado.
9. **Quando clip está `awaiting_review`,** botão principal vira "Revisar" → link pra `/videos/[videoId]/clip/[clipId]/review`.
10. **Criar página** `frontend/app/(dashboard)/videos/[id]/clip/[clipId]/review/page.tsx`.
11. **Criar componentes** em `frontend/components/features/review/`:
    - `review-layout.tsx` — split view com player + painel
    - `youtube-embed-player.tsx` — embed do vídeo unlisted
    - `title-selector.tsx` — radio group com 5 opções + manual + regenerar
    - `description-editor.tsx` — textarea plain text + contador + regenerar
    - `whatsapp-editor.tsx` — textarea + regenerar + botão copiar (disabled até publish)
    - `publish-confirm-dialog.tsx` — `AlertDialog` com preview
    - `discard-confirm-dialog.tsx` — destrutivo
    - `published-banner.tsx` — banner pós-publicação com link + copiar
12. **Hook de auto-save** com debounce 1s (provavelmente usando React Query + `useDebouncedCallback` do `use-debounce`).
13. **Remover stub** `/videos/[id]/review/page.tsx`.

### Fase C — Integração + validação
14. **Validações de tamanho** sincronizadas front+back (100 título, 5000 descrição).
15. **Tratamento de erros no modal** conforme tabela da grilling (401/403/404/5xx).
16. **Empty states** pra campos com IA não gerada (placeholder "Aguardando geração" + botão gerar/regenerar).
17. **Testes e2e** (se houver infra) do fluxo `ready → enviar pra revisão → edit → publish`.

### Fase D — Polimento
18. Ajustes UX (animações, toasts, tooltips das permissões).
19. Teste manual com conta real do YouTube.
20. Abrir PR e seguir fluxo normal (ship skill).

## 6. Perguntas em aberto

Nenhuma bloqueante. Algumas escolhas técnicas menores podem aparecer na implementação:

- **Auto-resize da textarea:** usar `react-textarea-autosize` ou implementar com CSS? → escolher o mais simples no momento.
- **Copiar pro clipboard:** `navigator.clipboard.writeText()` com fallback via `execCommand`? → `navigator.clipboard` basta (projeto é web app moderno).
- **Regenerar com IA enquanto KAI-59/60/61 não existem:** backend retorna 501 Not Implemented e frontend mostra "Geração IA em desenvolvimento". **Decidir na hora** se vale stub um mock pra testar o fluxo.
- **Polling de geração IA:** intervalo sugerido 3-5s. Se KAI-59/60/61 ainda não existem, talvez pular polling todo na primeira entrega.

## 7. Artefatos relevantes

### Arquivos-chave a modificar
- `backend/app/modules/clips/enums.py` — adicionar estados
- `backend/app/modules/clips/models.py` — adicionar colunas
- `backend/app/modules/clips/routes.py` — novos endpoints
- `backend/app/modules/clips/services/` — novos services
- `backend/app/modules/youtube/` — reverter privacy pra `unlisted`, implementar update privacy
- `backend/alembic/versions/` — nova migration
- `frontend/app/(dashboard)/videos/[id]/clip/[clipId]/review/page.tsx` — página nova
- `frontend/components/features/review/` — componentes novos
- `frontend/components/features/clips/clip-list.tsx` — renomear "Upload" pra "Enviar pra revisão"
- `frontend/lib/api/client.ts` — adicionar métodos pros novos endpoints

### Documentação
- `docs/PRD-sistema-clips-pregacoes-v2.md` — PRD completo
- `CLAUDE.md` — convenções do projeto (importante: tests sem mocks, Docker pros comandos de backend, design system do frontend)
- Memory: `~/.claude/projects/.../feedback_*` — preferências do usuário

### Comandos úteis (do Makefile)
```bash
make up-dev              # start com hot reload
make migration msg="add awaiting_review and discarded states"  # criar migration
make migrate             # aplicar
make test-backend        # pytest async
make test-frontend       # vitest/jest
```

## 8. Instruções pra próxima sessão

### Preferências do user (de `feedback_*` na memória)
- **Comandos backend rodam em Docker** — não rodar direto no host
- **Testes sem mocks** — usar model_bakery + TDD skill pra implementação
- **Design system obrigatório** — usar frontend-design skill pra novas telas, priorizar UX
- **Linear:** nunca marcar como Done manualmente — fluxo de branch/PR auto-fecha

### Abordagem recomendada
- **TDD**: começar pelos testes de backend (services + endpoints) antes do frontend
- **Tracer-bullet**: fatiar por slice vertical (ex: publicar funcional end-to-end antes de polir visual)
- **Grilling aprovou tudo** — não re-debater decisões, só esclarecer se surgir ambiguidade real no código
- **Se bloquear em KAI-59/60/61:** o backend pode expor endpoints regenerate/* retornando 501 e o frontend mostrar placeholder; não esperar essas tasks pra entregar a tela

### Armadilhas conhecidas
- **Privacidade `private` → `unlisted`:** não esquecer que isso já existe como commit anterior (KAI-54 mudou de unlisted pra private). O YouTube `private` não permite embed por terceiros — a tela **não funciona** sem essa reversão.
- **Flush síncrono antes de publish:** se o auto-save estiver em vôo quando user clica "Publicar", precisa aguardar o save (ou cancelar o debounce e fazer flush imediato). Testar esse edge case.
- **Role check no backend é obrigatório** — não confiar só no frontend disabled. Usar `require_role(UserRole.ADMIN)` nos endpoints de publish/discard.
- **YouTube embed do `unlisted`:** só funciona com o video ID direto (não precisa auth). Confirmar que o campo `youtube_video_id` já está persistido após upload (veio do KAI-54).
- **Soft delete vs cleanup:** clip `discarded` mantém registro; arquivos locais ficam pra cleanup job futuro (não implementar agora).

### Tom
- Foco em entrega. Todas as decisões foram tomadas na grilling.
- Se surgir ambiguidade real não prevista, **perguntar ao user** em vez de inventar. Evitar over-engineering.
- Respostas concisas. Usuário prefere terseness.

### Arquivos de contexto pra ler primeiro
1. `docs/handoffs/kai-55-interface-revisao-publicacao.md` (este arquivo)
2. Descrição completa da KAI-55 no Linear (seção "Design Decisions" + "Critérios de Aceite")
3. `CLAUDE.md` do projeto
4. `backend/app/modules/clips/` pra entender estrutura atual
5. `backend/app/modules/youtube/` pra identificar onde mudar `private → unlisted`
