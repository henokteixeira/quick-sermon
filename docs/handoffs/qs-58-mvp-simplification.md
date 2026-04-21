# Handoff: QS-58 MVP Simplification — Remover IA, manter captions density puro

**Data:** 2026-04-20
**Status:** aguardando implementação (design concluído via grill-me; QS-58 e QS-75 atualizadas no Linear)

## 1. Objetivo

Simplificar o MVP de detecção automática de timestamps (QS-58) para usar APENAS captions density do YouTube com gap híbrido (5s/10s), removendo todo o código de IA (Whisper, Ollama, LLM, VAD, boundary refine). Motivação: após 7 iterações com IA o melhor resultado foi 4/10 hits no dataset (CA1 exige ≥9/10). Os erros restantes são arquiteturais e exigem reengenharia maior, que virou a issue QS-75. Preferiu-se shippar um MVP minimalista com fallback manual (EC-02/QS-62) e investigar IA em nova issue.

## 2. Contexto essencial

### Stack
- Backend: Python 3.12 + FastAPI + SQLAlchemy 2.0 async + Alembic + Temporal
- Frontend: Next.js 14 App Router + shadcn/ui + React Query + Zustand
- Branch: `henok/qs-58-deteccao-automatica-de-timestamps` (commit pendente)
- Project Linear: Quick Sermon

### Restrições da arquitetura
- Modules nunca se importam entre si (cross-module via Temporal activities)
- Async SQLAlchemy obrigatório
- `AppException` como base + global handler
- Backend commands rodam DENTRO do Docker (`docker compose exec`)
- TDD com `factory-boy` (projeto real usa factory-boy, não model_bakery)
- Design system shadcn/ui no frontend
- Nunca marcar Linear como Done manualmente; branch naming fecha automaticamente

### Decisões-chave (gravadas no QS-58 seção "MVP Simplification")
- **Cascata simplificada**:
  1. `chapters` (yt-dlp dump-json) → short-circuit se confidence ≥ 90%
  2. `captions` density com **gap híbrido**: tenta `gap_tolerance=5s`; se bloco não plausível (<15min), tenta `gap_tolerance=10s`
  3. Sem chapters + sem captions → `status=skipped`, `error_message="sem_legendas_disponiveis"`
- **Confidence**: fórmula atual mantida — `max(40, min(82, int(40 + density * 4)))`. Alerta visual <80% vai aparecer na maioria dos casos (honesto com MVP sem IA).
- **Sem retry em `skipped`** (resultado é determinístico).
- **Reset completo** de dados: tabelas `video_detections`, `videos`, `clips` + volumes Docker (`clips_data`, `videos_data`).
- **Manter `OPENAI_API_KEY`** em settings (será reutilizado na QS-75).
- **Manter fixture** `reference_videos.json` e script `scripts/test_detection_dataset.py` (servem QS-75 também).

## 3. O que já foi feito

1. **Implementação original de QS-58** (anterior a esta sessão): migration `video_detections`, 7 activities Temporal, workflow, services, endpoints REST, frontend `DetectionCard` + atalho no clip editor. 98 testes passando.
2. **Adições de IA feitas nesta sessão** (todas serão removidas na próxima):
   - Activity `analyze_captions_with_llm_activity` (Ollama → gpt-4o-mini)
   - Activity `refine_boundaries_with_whisper_activity` (Whisper amostrado nas fronteiras)
   - Service `BoundarySegmentsDownloader` em `detection_clients.py`
   - Service `WhisperApiClient` em `detection_clients.py`
   - Service `VadRunner` em `detection_clients.py`
   - Core `app/core/llm_client.py` (OpenAI Chat compartilhado)
   - Script `backend/scripts/test_detection_dataset.py` (roda os 10 vídeos do dataset) — **MANTER**
   - Fixture `backend/app/modules/videos/tests/fixtures/reference_videos.json` com 10 vídeos + ground truth — **MANTER**
3. **7 rodadas de teste batch** no dataset. Melhor: 4/10 hits (gap=5 + boundary ±3/±6). Padrões de erro: hint da density errado em vídeos com louvor denso (start) ou EBD curtas (end muito tarde).
4. **Entrevista grill-me completa**: todas decisões foram discutidas uma-a-uma com o usuário. Resumo apendado em QS-58 como seção "## MVP Simplification (2026-04-20)".
5. **Issue QS-75 criada** no Linear: "Refinamento de detecção de timestamps com IA: viabilidade e integração". Priority Normal. Related to QS-58/QS-62/QS-73/QS-74.

### Decisões descartadas hoje (não voltar atrás)
- VAD com silero-vad em CPU — timeout 12-15min em áudio de 2h, valor baixo.
- LLM analisando buckets agregados (Ollama ou gpt-4o-mini) — tendência a copiar o hint da density ou cortar em agradecimentos intermediários.
- Whisper amostrado em todo vídeo — latência + custo altos.
- Boundary refine ±6min — ajuda V1/V5 mas quebra V6.
- `gap_tolerance` fixo — não há valor ótimo universal.

## 4. Estado atual

- Código de IA todo presente no branch (não foi removido).
- Containers rodando com IA habilitada (Ollama, OpenAI key configurada, silero-vad/torch no Docker).
- Detections de teste no banco com `method` entre `'chapters'`, `'captions'`, `'whisper_llm'`, `'vad'`.
- Volumes `clips_data` e `videos_data` com ~300–500MB de áudios cacheados.
- **Nada de simplificação foi aplicado ainda** — a próxima sessão faz TUDO.
- Última validação: backend boot OK, frontend lint OK, 98 testes passando.
- QS-58 e QS-75 atualizadas/criadas no Linear.

## 5. Próximos passos (ordem sugerida)

1. **Ler QS-58 seção "## MVP Simplification (2026-04-20)"** no Linear — contém todas as decisões.

2. **Remover código de IA** (ordem sugerida, começar pelos dependentes):

   - `backend/app/core/llm_client.py` → **deletar arquivo inteiro**
   - `backend/worker.py` → remover imports e entradas em `workflows=[]` e `activities=[]`:
     - Workflows: remover `refine_boundaries_with_whisper_activity` etc. do `activities=[]` list.
     - Activities a remover da lista: `extract_audio_activity`, `analyze_captions_with_llm_activity`, `refine_boundaries_with_whisper_activity`, `sample_transcribe_activity`, `llm_infer_sermon_range_activity`. **Manter**: `detect_chapters_activity`, `fetch_captions_activity`, `persist_detection_result_activity`.
   - `backend/app/modules/videos/workflows.py` → simplificar para cascata enxuta:
     1. chapters (já existe)
     2. captions (já existe)
     3. combine (chapters, captions)
     4. persist (completed) OR persist (skipped) se ambos vazios
     - Remover todo o bloco de fallback (extract_audio, transcribe, llm_infer, boundary_refine).
     - Remover imports e constants não usados (`CaptionsLlmInput/Result`, `BoundaryRefineInput/Result`, `ExtractAudioInput/Result`, `VadInput/Result`, `TranscribeInput/Result`, `LlmInferInput/Result`).
   - `backend/app/modules/videos/activities.py` → remover activities e dataclasses órfãs:
     - Activities a remover: `extract_audio_activity`, `detect_vad_activity`, `sample_transcribe_activity`, `llm_infer_sermon_range_activity`, `analyze_captions_with_llm_activity`, `refine_boundaries_with_whisper_activity`.
     - Dataclasses a remover: `ExtractAudioInput`, `ExtractAudioResult`, `VadInput`, `VadResult`, `TranscribeInput`, `TranscribeResult`, `LlmInferInput`, `LlmInferResult`, `CaptionsLlmInput`, `CaptionsLlmResult`, `BoundaryRefineInput`, `BoundaryRefineResult`.
     - Funções a remover: `_probe_audio_duration`, `_pick_sample_points`, `_cut_audio_segment`, `_build_sermon_prompt`, `_build_boundary_segments`, `_build_boundary_prompt`, `_clamp_to_hint_window`, `_filter_cues_by_window`. Constants: `SERMON_LLM_PROMPT_TEMPLATE`, `CAPTIONS_LLM_PROMPT_TEMPLATE`, `BOUNDARY_LLM_PROMPT_TEMPLATE`, `BOUNDARY_*_SECONDS`, `BOUNDARY_*_SAMPLES`, `START_REFINE_*`, `END_REFINE_*`, `WINDOW_MARGIN_SECONDS`.
     - **Manter**: `detect_chapters_activity`, `fetch_captions_activity`, `persist_detection_result_activity` + suas dataclasses.
   - `backend/app/modules/videos/services/detection_clients.py` → remover `WhisperApiClient`, `BoundarySegmentsDownloader`, `VadRunner`, `_get_vad_model`, `_vad_model`. **Manter**: `CaptionsFetcher`, `ChaptersFetcher`, `CaptionCue`, `parse_vtt`, `VTT_TIMESTAMP`, `_vtt_time_to_seconds`. Limpar imports (`AsyncOpenAI`, `subprocess` se não for mais usado, etc.).
   - `backend/app/modules/videos/services/detection_heuristics.py` → remover `compute_confidence_from_vad`, `compute_confidence_from_llm`, `parse_llm_json`, `aggregate_cues_to_buckets`. **Manter**: `compute_confidence_from_chapters`, `compute_confidence_from_captions`, `is_plausible_sermon_duration`, `combine_confidence`, `_largest_block`, `_normalize`, `_ranges_agree`, `SERMON_KEYWORDS`, `PhaseResult`.
   - `backend/app/modules/videos/enums.py` → remover `DetectionMethod.WHISPER_LLM` e `DetectionMethod.VAD`. **Manter**: `CHAPTERS`, `CAPTIONS`, `CASCADE`.
   - `backend/app/modules/videos/models.py` → manter colunas `raw_fase_vad`, `raw_fase_llm` no schema (migration não muda) — já estão nullable, apenas param de ser populadas.

3. **Implementar gap híbrido** em `compute_confidence_from_captions`:
   ```python
   def compute_confidence_from_captions(cues, total_duration):
       if not cues:
           return None, None, 0
       spans = [(c["start"], c["end"]) for c in cues]
       for gap in (5.0, 10.0):
           block = _largest_block(spans, gap_tolerance=gap)
           if block is None or not is_plausible_sermon_duration(block[0], block[1]):
               continue
           duration_min = max(1.0, (block[1] - block[0]) / 60.0)
           cues_inside = sum(1 for c in cues if block[0] <= c["start"] <= block[1])
           density = cues_inside / duration_min
           confidence = max(40, min(82, int(40 + density * 4)))
           return int(block[0]), int(block[1]), confidence
       return None, None, 0
   ```

4. **Workflow simplificado** — comportamento `skipped` quando captions e chapters vazios:
   ```python
   chapters_empty = chapters_phase[0] is None
   captions_empty = captions_phase[0] is None
   if chapters_empty and captions_empty:
       await self._persist(params,
           status=DetectionStatus.SKIPPED,
           error_message="sem_legendas_disponiveis",
           raw_fase_chapters=chapters.raw,
           raw_fase_captions=captions_raw,
       )
       return {"status": "skipped", "reason": "no_captions"}
   ```

5. **Atualizar testes**:
   - `backend/app/modules/videos/tests/test_detection_heuristics.py`: remover classes `TestVadHeuristic`, `TestLlmParser`, `TestLlmHeuristic`. Ajustar `TestCombineConfidence` para só chapters/captions. Adicionar `TestCaptionsHybrid` com casos: bloco plausível em gap=5, bloco implausível em gap=5 mas plausível em gap=10, nenhum plausível.
   - `backend/app/modules/videos/tests/test_activities.py`: remover `TestLlmInferActivity`, `FakeLlmClient`, `TestPickSamplePoints`, `TestBuildSermonPrompt`. Manter apenas testes de activities que permanecem.

6. **Remover dependências**:
   - `backend/requirements.txt`: remover `openai`, `silero-vad`, `soundfile`.
   - `backend/Dockerfile` e `backend/Dockerfile.worker`: remover pacotes `libsndfile1`, `libgomp1` do `apt-get install`.
   - **Manter** em `app/core/config.py`: `OPENAI_API_KEY: str = ""` (para reuso na QS-75).
   - **Manter** em `docker-compose.yml`: env `OPENAI_API_KEY` e o serviço `ollama` (pode ficar, não prejudica — ou remover se quiser limpar — decidir com o usuário).

7. **Reset de dados** (destrutivo, confirmar com usuário):
   ```bash
   docker compose exec -T db psql -U postgres quick_sermon -c "DELETE FROM video_detections; DELETE FROM clips; DELETE FROM videos;"
   docker compose exec -T backend bash -c "rm -rf /data/clips/* /data/videos/*"
   ```

8. **Rebuild Docker** após remoção de deps + libs (imagem fica ~1.5GB menor):
   ```bash
   make build
   docker compose up -d --force-recreate backend worker
   ```

9. **Rodar `pytest`** para garantir que tudo passa depois das remoções:
   ```bash
   docker compose exec -T backend pytest
   ```
   Esperado: ~70-80 testes (queda de 98 por causa das remoções de testes de IA).

10. **Validar manualmente**:
    - `make up-dev`, submeter 1 vídeo novo pelo frontend
    - Ver detecção em ~20–30s com `method=captions` ou `chapters`
    - `DetectionCard` mostra bem `completed` (verde ou amarelo se confidence < 80)
    - Testar vídeo sem legendas auto-sub → cai em `skipped` (UI mostra card neutro, sem retry)

11. **Opcional: rodar batch de validação** pra registrar baseline do MVP sem IA:
    ```bash
    docker compose exec -T -e PYTHONPATH=/app backend python /app/scripts/test_detection_dataset.py
    ```
    Anotar resultado (esperado 3–5 hits) no PR description.

12. **Commit e PR**:
    - Title: `feat(videos): MVP detection with captions density only (QS-58)`
    - Description: resumir remoções + gap híbrido + link para QS-75
    - Branch naming `henok/qs-58-*` fecha QS-58 automaticamente ao mergear

## 6. Perguntas em aberto

Nenhuma bloqueante. Decisões pequenas que podem surgir:

- **Serviço `ollama` no `docker-compose.yml`**: manter ou remover? Manter ocupa RAM (~5GB de modelos), remover libera. Recomendo remover (junto com volume `ollama_data`) já que não é mais usado. Confirmar com usuário.
- **Campos JSONB `raw_fase_vad` e `raw_fase_llm` no banco**: manter schema (migration não mudou), só deixam de ser populados. Futuramente QS-75 pode reativar.
- **Script `test_detection_dataset.py`**: vai precisar pequeno ajuste para remover lógica de `whisper_llm`/`vad` do display. Pode fazer durante a mesma PR ou deixar para QS-75.

## 7. Artefatos relevantes

### Links Linear
- **QS-58** (origem, com seção MVP Simplification): https://linear.app/kairon-tech/issue/QS-58/deteccao-automatica-de-timestamps
- **QS-75** (refinamento com IA, próximo trabalho): https://linear.app/kairon-tech/issue/QS-75/refinamento-de-deteccao-de-timestamps-com-ia-viabilidade-e-integracao

### Paths críticos
- `backend/app/core/llm_client.py` — DELETAR
- `backend/app/modules/videos/activities.py` — grande limpeza
- `backend/app/modules/videos/workflows.py` — simplificar cascata
- `backend/app/modules/videos/services/detection_clients.py` — remover classes de IA
- `backend/app/modules/videos/services/detection_heuristics.py` — gap híbrido
- `backend/app/modules/videos/enums.py` — remover `WHISPER_LLM`, `VAD`
- `backend/worker.py` — ajustar registros
- `backend/requirements.txt` — remover deps
- `backend/Dockerfile`, `backend/Dockerfile.worker` — remover libs nativas
- `backend/app/modules/videos/tests/test_activities.py`, `test_detection_heuristics.py` — ajustar
- `backend/scripts/test_detection_dataset.py` — ajustar display (opcional)
- `backend/app/modules/videos/tests/fixtures/reference_videos.json` — MANTER

### Git
- Branch: `henok/qs-58-deteccao-automatica-de-timestamps`
- Commits pendentes: adições de IA (tudo a ser removido) + um commit final de simplificação
- 1 PR único fechando QS-58

### Comandos úteis
```bash
make up-dev                                                    # subir com hot reload
docker compose exec -T backend pytest                          # rodar testes
docker compose exec -T db psql -U postgres quick_sermon        # acessar banco
make build                                                     # rebuild após mudanças em requirements/Dockerfile
docker compose up -d --force-recreate backend worker           # recriar containers
```

## 8. Instruções pra próxima sessão

### Tom
- PT-BR técnico conciso.
- File paths + line numbers ao referenciar código.
- Não criar `.md` novos a menos que explicitamente pedido (decisões já estão no Linear).

### Armadilhas a evitar

1. **Não re-litigar decisões já gravadas na QS-58/QS-75**. O usuário passou 1h+ na entrevista grill-me aprovando tudo. Partir direto pra implementação. Se discordar de algo, PERGUNTAR antes de mudar.
2. **Reset do banco é destrutivo**. Confirmar antes de executar: `DELETE FROM ...` + `rm -rf /data/...`.
3. **Rodar `make build` depois de mexer em `requirements.txt` ou Dockerfile**. Sem rebuild, mudanças não afetam o container.
4. **Worker não tem hot-reload de imports**. Após mudar activities/workflow: `docker compose restart worker`.
5. **`OPENAI_API_KEY` fica em settings** como `str = ""` — não deletar. Reuso na QS-75.
6. **Branch naming fecha QS-58 automaticamente**. NUNCA marcar como Done manualmente.
7. **Fixture `reference_videos.json` e script `test_detection_dataset.py` são MANTIDOS**. Servem a QS-75.
8. **Testes usam `factory-boy`**, não `model_bakery`. A memória pode estar desatualizada — conferir `requirements-dev.txt`.
9. **Contagem de testes vai cair de 98 para ~70-80** após remover testes de IA. Isso é esperado. Se for menos que 60, checar se remoção foi além do escopo.
10. **Batch de validação custa $0** agora (sem IA). Pode rodar quantas vezes quiser.
11. **Imagem Docker deve ficar ~1.5GB menor** após remover torch/silero-vad/openai. Valor de confirmação pós-rebuild.

### Primeira pergunta a fazer ao usuário na nova sessão

"Oi, retomando QS-58 após a entrevista de grill-me. Posso começar removendo o código de IA conforme as decisões gravadas no Linear (QS-58 seção MVP Simplification), ou tem alguma mudança de última hora antes de arrancar?"
