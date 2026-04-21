# Handoff: QS-58 Grill-me — Detecção automática de timestamps (pronta para implementação)

**Data:** 2026-04-19
**Status:** aguardando implementação (entrevista de design concluída, decisões gravadas no Linear)

## 1. Objetivo

Implementar RF-02 do PRD do Quick Sermon: detectar automaticamente o início e fim da pregação dentro de uma live do YouTube (cultos), pré-preenchendo os timestamps quando o usuário for criar um clipe "pregação completa". Meta de precisão: ±2min em ≥85% dos casos; tempo-alvo: ≤60s por live. Feature reduz atrito de criação de clipes, que hoje exige o usuário digitar `start_time`/`end_time` manualmente.

## 2. Contexto essencial

### Stack
- **Backend**: Python 3.12 + FastAPI + SQLAlchemy 2.0 async + Alembic + Temporal
- **Frontend**: Next.js 14 App Router + shadcn/ui + React Query + Zustand
- **LLM local existente**: Ollama (llama3) em `backend/app/modules/content/services/ollama_client.py`
- **Storage**: filesystem local via volume Docker `/data/clips/{clip_id}/` — pattern será replicado para `/data/videos/{video_id}/`
- **Temporal**: task queue `"video-processing"`, worker em `backend/worker.py`, workflows atuais (`DownloadAndTrimWorkflow`, `UploadToYouTubeWorkflow`) com granularidade por activity
- **yt-dlp + ffmpeg**: já em uso (download, trim, metadata probe)

### Restrições da arquitetura
- Modules nunca se importam entre si (cross-module via Temporal activities)
- Um service por use case, método `execute()`
- Async SQLAlchemy obrigatório
- `AppException` como base + global handler
- `Errors never block the user flow — always provide manual fallback` (CLAUDE.md)
- Backend commands rodam dentro do Docker container (memória: `feedback_docker_commands.md`)
- TDD com `model_bakery`, sem mocks (memória: `feedback_testing_approach.md`)
- Design system obrigatório; usar skill `frontend-design` para páginas novas (memória: `feedback_frontend_design.md`)
- Nunca marcar Linear como Done manualmente; branch/PR naming fecha automaticamente (memória: `feedback_linear_workflow.md`)

### Decisões-chave da entrevista (gravadas na descrição da QS-58)

- **Gatilho**: ao adicionar vídeo (não por clipe). UX não-bloqueante (async).
- **Estratégia**: cascata híbrida de 5 fases: `chapters → CC → VAD → Whisper amostrado → LLM`.
- **Providers iniciais**: Whisper API (OpenAI) + Ollama llama3. Migração para cloud-only em produção é plano futuro.
- **Output**: range único com confidence agregado. Sem lista de múltiplos candidatos (reinterpreta linha original da issue).
- **Confidence**: heurística documentada; threshold <80% ativa alerta visual + habilita editor manual de EC-02 (QS-62).
- **Duração plausível da pregação**: 15–75min (ajustada após calibração com dataset real de 10 vídeos; EBD curta tem 21min).
- **Modo permissivo**: vídeo sempre registra; falha técnica permite retry manual; confidence baixa não tem retry.
- **Skip**: lives <5min e lives em andamento (`is_live_now=true`).
- **Schema**: nova tabela `video_detections` (1:N com `videos`, histórico preservado, JSONB por fase com sumário compacto).
- **Temporal**: novo `DetectSermonTimestampsWorkflow` no módulo `videos` (primeiro desse módulo), granular por activity.
- **Timeouts**: workflow hard-limit 3min; activities por fase (extract_audio=60s, chapters=10s, captions=10s, vad=30s, transcribe=60s, llm_infer=30s, persist=5s).
- **Storage**: `/data/videos/{video_id}/audio.opus` (libopus 16kHz mono 32kbps, ~30MB/live 2h), **retenção permanente** — reutilizável por QS-73.
- **Permissões**: todas as roles (admin, editor) podem disparar, ver, retry.
- **Apenas URLs públicas/não-listadas.** Privadas fora de escopo.
- **Idioma**: apenas PT-BR.

## 3. O que já foi feito

1. **Entrevista grill-me** concluída (11 perguntas principais + sub-perguntas) — cobriu gatilho, UX, estratégia técnica, providers, escopo, confidence, schema, Temporal, timeouts, retention, URLs privadas, permissões, critérios de aceite, CC/legendas como fase adicional.
2. **Exploração do codebase** feita pelo agente Explore — mapeados modules, workflows existentes, clips module (já tem `start_time`/`end_time` manuais), Ollama integration, yt-dlp usage, storage pattern.
3. **QS-58 atualizada no Linear** com seção `## Design Decisions` appended (descrição original preservada), contendo: Context, 15 Decisions, Constraints, Dataset de referência (CA1), 5 Critérios de Aceite (CA1-CA5), Open Questions, Scope in/out.
4. **Dataset de 10 vídeos** fornecido pelo usuário com ground truth (start/end da pregação manualmente labeled) — tabela completa na descrição da QS-58.
5. **QS-73 criada**: "Transcrição completa persistida de vídeos" (spin-off out-of-scope), related → QS-58.
6. **QS-74 criada**: "Criação assistida de clipes com tipos ricos e busca textual" (spin-off out-of-scope), blockedBy QS-73, related → QS-58.
7. **Ajuste de heurística**: faixa plausível de duração da pregação mudou de 30-70min → 15-75min durante a entrevista ao receber os dados reais (EBD 14/12 tem 20m55s, abaixo da faixa original).

### Decisões DESCARTADAS durante a entrevista (para não voltar atrás)
- **Transcrição completa em QS-58**: rejeitada — vira QS-73. Manteria QS-58 enxuta.
- **Múltiplos candidatos de timestamp**: rejeitado (usuário preferiu "retornar apenas o de maior confidence").
- **Toggle "usar IA" por clipe**: rejeitado — detecção é por vídeo, automática.
- **UX bloqueante (loader síncrono ao submeter URL)**: rejeitado — não-bloqueante async escolhido.
- **Whisper local (full-local C1)**: rejeitado — qualidade ruim em PT-BR + lento em CPU.
- **Full cloud agora (C3/C4)**: adiado para produção futura — C2 (Whisper API + Ollama) escolhido para início.
- **Granularidade monolítica de activity**: rejeitada — (a) granular por fase escolhida.
- **Retention imediata ou 48h do áudio**: rejeitadas — permanente escolhido (reutiliza em QS-73).

## 4. Estado atual

- **Zero código foi escrito.** A entrevista foi puramente de design.
- Branch `henok/qs-58-deteccao-automatica-de-timestamps` ainda não existe — será criado ao começar implementação.
- Branch atual: `main`. Git status tem muitos arquivos `D` em `.claude/skills/react-best-practices/**` e algumas modificações em skills — nada relacionado à QS-58; não mexer.
- Commits recentes recentes mostram features já entregues: clips detail page tabs (#9), clip review/publish workflow (KAI-55, #8), yt-dlp download optimization (KAI-71, #7).

## 5. Próximos passos (ordem sugerida)

1. **Checkout e criar branch** conforme Linear: `git checkout -b henok/qs-58-deteccao-automatica-de-timestamps`.
2. **Confirmar dependências**: instalar no container backend `silero-vad` (PyTorch), `openai` (Whisper API), `libopus` via ffmpeg (provavelmente já disponível). Atualizar `requirements.txt`.
3. **Variáveis de ambiente**: adicionar `OPENAI_API_KEY` ao `.env` / `config.py` com campo `settings.OPENAI_API_KEY`.
4. **Alembic migration**: criar tabela `video_detections` conforme schema decidido (campos: id, video_id FK, start_seconds, end_seconds, confidence int 0-100, method enum {chapters, captions, vad, whisper_llm, cascade}, status enum {running, completed, failed, skipped}, error_message text, raw_fase_chapters JSONB, raw_fase_captions JSONB, raw_fase_vad JSONB, raw_fase_llm JSONB, created_at, completed_at). Rodar `make migration msg="add_video_detections_table"` dentro do Docker.
5. **Módulo videos existente**: inspecionar e estender — models.py (adicionar enum `DetectionStatus` se necessário ou só no `video_detections`), schemas.py (DTO de response), routes.py (endpoints `GET /videos/{id}/detection` e `POST /videos/{id}/detection/retry`), repositories, services.
6. **Criar workflows.py + activities.py no módulo videos** com:
   - Workflow: `DetectSermonTimestampsWorkflow`
   - Activities (uma função cada, com `@activity.defn`): `extract_audio_activity`, `detect_chapters_activity`, `fetch_captions_activity`, `detect_vad_activity`, `sample_transcribe_activity`, `llm_infer_sermon_range_activity`, `persist_detection_result_activity`
   - Timeouts por fase conforme decidido
   - Short-circuit: se chapters retornam confidence ≥90%, pula demais fases
7. **Registrar no worker.py**: adicionar novo workflow e activities no setup.
8. **Disparar workflow**: no handler de `POST /videos` (ou serviço de criação de vídeo), após registro do vídeo, chamar `client.start_workflow(DetectSermonTimestampsWorkflow, video_id, task_queue=settings.TEMPORAL_TASK_QUEUE)` em fire-and-forget.
9. **Fixture de dataset**: criar `backend/app/modules/videos/tests/fixtures/reference_videos.json` com os 10 vídeos (está na descrição da QS-58).
10. **Testes TDD com model_bakery, sem mocks**: escrever testes unitários por activity (chapters, captions, VAD heurística, combinação de confidence), teste de integração da workflow completa usando o replay testing do Temporal. Para CA1, teste e2e que roda os 10 vídeos e verifica ±2min em ≥9/10.
11. **Frontend**: na página do vídeo, adicionar card de status da detecção (polling/refetch). No form de criação de clipe, adicionar atalho "Usar pregação completa sugerida" quando `detection_status=completed`; se confidence <80%, alerta visual e editor manual já habilitado.
12. **PR**: título `feat(videos): automatic sermon timestamp detection (QS-58)`, seguir padrão dos recentes (`feat(clips)`, `perf(clips)`). Branch naming fecha a issue automaticamente.

## 6. Perguntas em aberto

Nenhuma bloqueante. Algumas coisas a refinar durante implementação:

- **Formato do prompt para Ollama llama3** na fase LLM: precisa iteração. Proposta inicial: enviar amostras de transcrição com timestamps formatados em JSON e pedir `{"sermon_start_seconds": X, "sermon_end_seconds": Y, "reasoning": "..."}`. Validar empiricamente.
- **Número ótimo de amostras Whisper**: planejado 8-12 amostras de 30s, mas pode afinar com dataset de referência.
- **Política de seleção de amostras**: uniformemente distribuídas vs. guiadas por candidatos da fase VAD? Segunda opção é mais eficiente mas mais complexa. Começar com uniforme e refinar se precisão ficar aquém de 85%.
- **Margem de "pregação" na fase captions**: se CC mostra cadência de fala sustentada por X minutos sem interrupção, chamar de pregação candidata. Threshold X a definir em implementação (sugestão: 15min).
- **Ollama pode estar offline** em produção (ambiente local). Necessário fallback? Decisão: por ora, se Ollama falhar, fase LLM erra e confidence final cai em função da fórmula; vídeo é registrado com confidence baixa → editor manual habilitado. Alinha com modo permissivo.

## 7. Artefatos relevantes

### Links Linear
- **QS-58** (issue principal com Design Decisions e CA1-CA5): https://linear.app/kairon-tech/issue/QS-58/deteccao-automatica-de-timestamps
- **QS-73** (spin-off, depends on): https://linear.app/kairon-tech/issue/QS-73/transcricao-completa-persistida-de-videos
- **QS-74** (spin-off, blocked by QS-73): https://linear.app/kairon-tech/issue/QS-74/criacao-assistida-de-clipes-com-tipos-ricos-e-busca-textual
- **QS-62** (editor manual, bloqueado por QS-58): https://linear.app/kairon-tech/issue/QS-62

### Paths relevantes no codebase
- `backend/app/modules/videos/` — módulo onde o novo código vive
- `backend/app/modules/clips/workflows.py` e `backend/app/modules/clips/activities.py` — pattern de referência para Temporal
- `backend/app/modules/content/services/ollama_client.py` — cliente Ollama existente (reutilizar ou replicar pattern)
- `backend/worker.py` — registrar novo workflow/activities aqui
- `backend/app/core/config.py` — adicionar `OPENAI_API_KEY` e quaisquer outras settings
- `frontend/app/(dashboard)/videos/[id]/clip/[clipId]/page.tsx` — página de criação/revisão de clipe (referência)
- `frontend/lib/api/client.ts` — axios com JWT interceptors; adicionar chamadas para os novos endpoints

### Git branch
- Branch a criar: `henok/qs-58-deteccao-automatica-de-timestamps`

### Comandos úteis
```bash
make up-dev                                              # subir serviços com hot reload
make test-backend                                        # rodar pytest
make migration msg="add_video_detections_table"          # criar Alembic migration
make migrate                                             # aplicar migrations
make logs                                                # ver logs
```

### Dependências a instalar (container backend)
- `silero-vad` (VAD offline, CPU)
- `openai` (Whisper API client — ou usar httpx direto para evitar dependência full SDK se preferir)
- `libopus`/`opus-tools` no Dockerfile se ffmpeg não tiver encoder opus habilitado (verificar primeiro)

## 8. Instruções pra próxima sessão

### Tom
- Português BR, técnico mas conciso. Responder em <100 palavras salvo quando precisar explicar design.
- Respeitar comunicação do usuário: `henok@mariaeducacao.com`, data: 2026-04-19.

### Nível de detalhe
- Alto durante implementação: identificar file paths e line numbers ao referenciar código.
- Não criar documentação em `.md` a menos que explicitamente pedido — decisões já estão na QS-58 no Linear.

### Armadilhas a evitar

1. **Não regravar decisões já tomadas.** Antes de discutir trade-offs, ler a seção `## Design Decisions` da QS-58. O usuário fez a entrevista completa e não quer re-litigar.
2. **Não mexer no escopo.** Transcrição completa, busca textual, múltiplos candidatos, URLs privadas, etc. ficaram explicitamente OUT. Criar código que os implemente é violação de escopo.
3. **Não marcar a QS-58 como Done manualmente.** Branch naming `henok/qs-58-...` + PR merged fecha automaticamente (memória existente).
4. **Rodar backend commands dentro do Docker** (`make test-backend`, `make migration`, etc.) — não na máquina host.
5. **TDD sem mocks**: usar `model_bakery` para fixtures. Integration tests batem DB real (memória: `feedback_testing_approach.md`).
6. **Design system no frontend**: usar shadcn/ui existente, skill `frontend-design` se criar página nova (memória: `feedback_frontend_design.md`).
7. **Não duplicar o Ollama client**. Ver `backend/app/modules/content/services/ollama_client.py` e reutilizar o padrão. Se for necessário, extrair para `backend/app/core/` (mas confirmar com usuário primeiro — cross-module reuse de infra merece conversa).
8. **Whisper API pode dar rate limit / timeout**. Paralelizar com asyncio.gather com semáforo (max 4-6 requests concorrentes). Cada activity `sample_transcribe_activity` deve isolar isso.
9. **Temporal activity timeouts: `start_to_close`**, não só schedule. Heartbeat para long-running activities.
10. **Dataset real do usuário**: os 10 vídeos da QS-58 são dados reais de cultos. Não publicar em lugar aberto (os YouTube IDs são públicos mas o uso é interno). Fixture fica só em `backend/app/modules/videos/tests/fixtures/`.

### Primeira pergunta a fazer ao usuário na nova sessão
"Oi, retomando QS-58. Quer começar pela migration `video_detections`, pela definição do workflow Temporal, ou prefere um plano de implementação granular antes de escrever código?"