# PRD — Sistema de Clips de Pregações
## Versão 2.1 | Atualizado em 2026-04-24 | Status: MVP (V1) em implementação avançada

> **Nota de versão:** este documento foi atualizado para refletir o estado real da implementação em abril de 2026. Mudanças arquiteturais e de regra de negócio realizadas durante a execução (QS-51/52/54/55, QS-58, QS-72 e redesign v2) estão incorporadas nas seções correspondentes. Ver [Apêndice A — Changelog](#apêndice-a--changelog-2026-04) para o detalhamento por seção.

---

## Índice

1. [Visão do Produto](#1-visão-do-produto)
2. [Objetivos e Métricas de Sucesso](#2-objetivos-e-métricas-de-sucesso)
3. [Personas](#3-personas)
4. [Escopo](#4-escopo)
5. [Arquitetura de Fluxo](#5-arquitetura-de-fluxo) (inclui 5.0 Modelo de Domínio)
6. [Requisitos Funcionais](#6-requisitos-funcionais) (RF-01 a RF-11)
7. [Requisitos Não-Funcionais](#7-requisitos-não-funcionais)
8. [Fluxos de Erro e Edge Cases](#8-fluxos-de-erro-e-edge-cases)
9. [Riscos e Dependências](#9-riscos-e-dependências)
10. [Roadmap](#10-roadmap)
11. [Glossário](#11-glossário)
12. [Apêndice A — Changelog (2026-04)](#apêndice-a--changelog-2026-04)

---

## 1. Visão do Produto

### 1.1 Problema

Editores de mídia em igrejas gastam **2–4 horas por vídeo** em tarefas manuais e repetitivas:

| Etapa Manual | Tempo Estimado |
|---|---|
| Assistir a live para localizar a pregação | 30–60 min |
| Anotar timestamps | 10–15 min |
| Download e corte no editor | 40–60 min |
| Criação de título, descrição, thumbnail | 20–30 min |
| Upload e publicação | 10–15 min |
| **Total** | **~2–4 horas** |

**Consequências diretas:**
- Publicação com atraso de 24–72h após o culto
- Burnout de voluntários
- Inconsistência na qualidade e formatação
- Custo com ferramentas pagas (~$50–100/mês)

### 1.2 Solução

Plataforma web que automatiza o pipeline completo: da URL da live até o vídeo publicado no YouTube, com intervenção humana mínima apenas na etapa de revisão e aprovação.

**Meta:** processar um culto completo em **menos de 20 minutos**, com **menos de 10 minutos de interação humana**.

### 1.3 Declaração de Valor

> *Para editores de mídia voluntários em igrejas, que hoje gastam horas em tarefas manuais e repetitivas, o Sistema de Clips é uma plataforma de automação que detecta, processa e publica pregações automaticamente — diferente de ferramentas genéricas de edição, nossa solução é construída especificamente para o fluxo de cultos, com revisão humana integrada antes da publicação.*

---

## 2. Objetivos e Métricas de Sucesso

### 2.1 Objetivos de Negócio

| # | Objetivo | Indicador | Meta |
|---|---|---|---|
| O1 | Reduzir tempo de produção | Tempo médio por vídeo | < 20 min |
| O2 | Aumentar volume de publicações | Vídeos/semana por editor | 8–10 (vs. 2–3 atual) |
| O3 | Manter custo operacional baixo | Custo mensal | < $50/mês |
| O4 | Reduzir tempo até publicação | Horas após o culto | < 12h |

### 2.2 Critérios de Go-Live

O produto só entra em produção se **todos** os critérios abaixo forem atendidos:

**Obrigatórios (bloqueantes):**
- [ ] Pipeline completo (submissão → publicação) funciona end-to-end sem falhas críticas
- [ ] Tempo de processamento de vídeo de 1h é < 20 minutos
- [ ] Precisão de detecção de timestamps ≥ 80% em conjunto de testes de 20 vídeos
- [ ] Upload para YouTube sem falha em 100% dos casos de teste

**Aceitáveis no lançamento:**
- Processamento sequencial (fila de 1 por vez)
- Thumbnails geradas manualmente pelo editor
- Analytics básico (somente contagem de vídeos processados)

**Inaceitáveis (zero tolerância):**
- Perda ou degradação de qualidade de vídeo/áudio
- Falha de segurança (exposição de tokens, dados de usuários)
- Bug que impeça o fluxo principal de funcionar

### 2.3 Métricas de Produto (pós-lançamento)

| Métrica | Baseline Atual | Meta 30 dias | Meta 90 dias |
|---|---|---|---|
| Tempo médio de produção | 2–4h | < 30 min | < 20 min |
| Taxa de detecção correta | N/A | ≥ 80% | ≥ 85% |
| Taxa de aprovação sem edição manual | N/A | ≥ 50% | ≥ 60% |
| NPS dos editores | N/A | ≥ 30 | ≥ 40 |

---

## 3. Personas

### 3.1 Persona Primária — Editor de Mídia Voluntário

**Carlos, 28 anos | Coordenador de Mídia**

- Trabalha full-time em TI durante a semana; volunterio aos finais de semana
- Conhecimento básico de edição de vídeo (não é especialista)
- Usa computador pessoal (sem servidor dedicado, mínimo 8GB RAM)

**Jobs to be done:**
1. Publicar a pregação rapidamente após o culto
2. Manter padrão de qualidade sem esforço manual
3. Ter controle para corrigir quando a IA erra

**Frustrações atuais:**
- Processo lento consome o domingo inteiro
- Ferramentas genéricas têm curva de aprendizado alta
- Quando erra um timestamp, tem que recomeçar tudo

### 3.2 Persona Secundária — Líder de Comunicação

**Pastora Ana, 42 anos | Líder de Comunicação**

- Sem habilidades técnicas de edição
- Foco em estratégia, alcance e precisão teológica

**Jobs to be done:**
1. Garantir que o conteúdo publicado está teologicamente correto
2. Aprovar títulos e descrições antes de publicar
3. Saber o status de cada vídeo sem perguntar ao Carlos

---

## 4. Escopo

### 4.1 Incluído na V1

Status (2026-04-24): ✅ entregue · 🔄 parcial · ⏳ pendente

| Funcionalidade | Prioridade | Status | Referências |
|---|---|---|---|
| Submissão e validação de URL de live | Must Have | ✅ | QS-51 |
| Detecção automática de timestamps (MVP: chapters + captions density) | Must Have | ✅ | QS-58 |
| Ajuste manual de timestamps (fallback) | Must Have | ✅ | Clip editor (QS-52) |
| Download otimizado do segmento via yt-dlp | Must Have | ✅ | QS-52, QS-71 |
| Corte automático de vídeo (FFmpeg stream copy) | Must Have | ✅ | QS-52 |
| Upload para YouTube como `unlisted` + OAuth 2.0 | Must Have | ✅ | QS-54 |
| Interface de revisão com preview do YouTube | Must Have | ✅ | QS-55 |
| Publicação com um clique (muda privacy → `public`) | Must Have | ✅ | QS-55 |
| Descartar clip (soft delete + remoção do YouTube) | Must Have | ✅ | QS-55 |
| Autenticação e controle de acesso por roles | Must Have | ✅ | QS-57 |
| Página de detalhes do clip com abas | Must Have | ✅ | QS-72 |
| Dashboard com status em tempo real (polling React Query) | Should Have | ✅ | Redesign v2 (PR #11) |
| Geração de 5 opções de título (IA) | Must Have | ⏳ | QS-59 — endpoint retorna 501 |
| Geração de descrição estruturada (IA) | Must Have | ⏳ | QS-60 — endpoint retorna 501 |
| Geração de mensagem para WhatsApp (IA) | Must Have | ⏳ | QS-61 — endpoint retorna 501 |
| Notificações em tempo real | Should Have | 🔄 | Drawer/página mockados; backend SSE fica em QS-63 |
| Gestão de usuários (admin) | Should Have | 🔄 | Backend completo; UI usa dados mockados |
| Detecção de versículos citados | Could Have | ⏳ | Fora do MVP; candidato a V2 |

### 4.2 Fora do Escopo (V1)

- Publicação em outras plataformas (Instagram, TikTok, Shorts)
- Geração e edição de legendas
- Geração automática de thumbnails
- Clips curtos / Reels
- Processamento paralelo (fila com mais de 1 simultâneo)
- Suporte a idiomas além do português
- Aplicativo mobile
- Multi-tenant (múltiplas igrejas)

### 4.3 Roadmap Futuro

| Versão | Funcionalidades |
|---|---|
| V1 (em curso) | Pipeline end-to-end manual + detecção MVP (chapters + captions density) sem IA |
| V1.1 | Geração de conteúdo com LLM na nuvem (QS-59/60/61) — ativar endpoints 501 |
| V2 | Refinamento de detecção de timestamps com Whisper/LLM (QS-75), legendas automáticas completas, clips curtos para Reels/Shorts, notificações reais via SSE/WebSocket (QS-63) |
| V3 | Thumbnails com IA, publicação multiplataforma, analytics avançado |
| V4 | Multi-tenant, aplicativo mobile |

---

## 5. Arquitetura de Fluxo

### 5.0 Modelo de Domínio (atualizado)

O domínio foi refinado durante a implementação para separar três entidades independentes:

- **Video** — a live original submetida pelo editor. Agrupa os clips extraídos dela. Um `Video` pode ter 0..N `Clip`s.
- **VideoDetection** — resultado do pipeline de detecção automática de timestamps da pregação (tabela separada com seus próprios estados, métodos e fases em JSONB).
- **Clip** — segmento específico da pregação (recortes com `start_time`/`end_time`). Tem ciclo de vida próprio (download → trim → upload → review → publish/discard) e é a entidade principal para a publicação.

> **Observação importante:** `video.status` é hoje um *dead state* (permanece `PENDING`). O status visível ao usuário é sempre agregado a partir de `VideoDetection.status` e dos `Clip.status` associados. Corrigir esse comportamento ou consolidar como derivado oficial fica no backlog.

### 5.1 Fluxo Principal (Happy Path)

```
[Editor cola URL da live]
        ↓
[Sistema valida URL, busca metadados via yt-dlp e exibe preview]
        ↓
[Video criado → dispara DetectSermonTimestampsWorkflow (Temporal)]
        ↓
[Cascata de detecção MVP (sem IA)]
  ├── Chapters (yt-dlp dump-json) — short-circuit se confidence ≥ 90%
  └── Captions density (VTT) com gap híbrido 5s → 10s
        ↓
[Confiança ≥ 80%]              [Confiança < 80% ou SKIPPED]
    ↓                                    ↓
[Sugestão pré-preenchida]   [Editor ajusta manualmente no clip editor]
        ↓
[Editor confirma timestamps e clica "Criar clip"]
        ↓
[Clip criado → dispara DownloadAndTrimWorkflow (Temporal)]
  ├── DOWNLOADING — yt-dlp (heartbeat a cada 5%, timeout 2h)
  └── TRIMMING — FFmpeg stream copy (timeout 10min)
        ↓
[Clip em READY — disponível para stream local e download pelo editor]
        ↓
[Editor clica "Enviar pra revisão" → UploadToYouTubeWorkflow]
  └── UPLOADING — Google Resumable Upload como `unlisted`
        ↓
[Clip em AWAITING_REVIEW]
        ↓
[Editor abre /videos/[id]/clip/[clipId]?tab=revisao]
  ├── Player embed do YouTube (preview unlisted)
  ├── Edita título (radio de 5 opções IA + manual) — auto-save debounce 1s
  ├── Edita descrição (≤ 5000 chars) — auto-save debounce 1s
  └── Edita mensagem WhatsApp (botão "Copiar" desabilitado até publicar)
        ↓
[Admin clica "Publicar" → POST /clips/{id}/publish]
  └── videos.update no YouTube muda privacy para `public`
        ↓
[Clip em PUBLISHED — banner com link público + WhatsApp habilitado]
```

**Caminhos alternativos:**
- Editor pode clicar **"Descartar"** (admin-only) em qualquer estado exceto `PUBLISHED` → soft delete + `videos.delete` no YouTube quando já havia upload.
- Erros em qualquer stage transicionam para `ERROR` com `error_code` específico; editor dispara **"Retry"** em `POST /clips/{id}/retry`.

### 5.2 Casos de Uso

#### UC-01: Processamento de Culto Semanal
**Ator:** Editor | **Frequência:** 1–2x/semana

| Passo | Ação | Responsável |
|---|---|---|
| 1 | Cola URL da live após o culto | Editor |
| 2 | Valida URL e exibe preview | Sistema |
| 3 | Detecta timestamps automaticamente | Sistema (IA) |
| 4 | Valida ou ajusta timestamps | Editor |
| 5 | Clica "Processar" | Editor |
| 6 | Executa pipeline (~15 min) | Sistema |
| 7 | Notifica conclusão | Sistema |
| 8 | Acessa revisão, seleciona título | Editor |
| 9 | Clica "Publicar" | Editor |
| 10 | Vídeo fica público; copia link/WhatsApp | Editor |

**Tempo esperado de interação humana:** 8–12 min

#### UC-02: Processamento em Lote
**Ator:** Editor | **Frequência:** Mensal

1. Editor submete múltiplas URLs (até 10)
2. Sistema enfileira e processa sequencialmente
3. Notifica quando todos estão prontos
4. Editor revisa e publica em sequência
5. Pode agendar datas de publicação individuais

#### UC-03: Ajuste Manual de Timestamps
**Ator:** Editor | **Frequência:** ~10–15% dos vídeos

1. Sistema exibe alerta: *"Confiança baixa (X%) — revise os timestamps"*
2. Editor vê player com marcadores visuais arrastáveis
3. Ajusta início e fim da pregação
4. Confirma; sistema continua pipeline normalmente

---

## 6. Requisitos Funcionais

Cada requisito inclui: descrição, critérios de aceitação (AC) e comportamento esperado em caso de falha.

---

### RF-01 — Submissão de Vídeo

**Descrição:** O sistema deve aceitar a URL de uma live do YouTube e validá-la antes de iniciar qualquer processamento.

**Critérios de Aceitação:**
- AC-01.1: Dado que o editor insere uma URL válida do YouTube, o sistema exibe preview com título, duração e thumbnail em até 3 segundos.
- AC-01.2: Dado que o editor insere uma URL inválida (não-YouTube, vídeo removido, privado), o sistema exibe mensagem de erro específica e não avança.
- AC-01.3: Dado que o vídeo tem duração menor que 20 minutos, o sistema exibe aviso *"Vídeo muito curto para conter uma pregação — deseja continuar?"* e aguarda confirmação.
- AC-01.4: O campo de URL aceita os formatos: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/live/`.

**Falha:** Ver [EC-01](#ec-01--url-inválida-ou-inacessível).

---

### RF-02 — Detecção Automática de Timestamps

**Descrição:** O sistema deve identificar automaticamente o início e o fim da pregação dentro da live.

> **Mudança em 2026-04-20 (QS-58 — MVP Simplification):** a detecção da V1 opera **sem IA**. Após 7 iterações com Whisper + LLM (Ollama, gpt-4o-mini) e VAD, o melhor baseline ficou em 4/10 hits no dataset. Decidimos shippar um MVP minimalista baseado apenas em sinais determinísticos do YouTube e abrir a issue [QS-75](https://linear.app/kairon-tech/issue/QS-75) para refinamento com IA em versão futura.

**Algoritmo MVP (V1):**
1. **Chapters (yt-dlp dump-json)** — se o criador marcou capítulos na live, casar heurísticas de palavras-chave (ex.: *pregação*, *palavra*, *mensagem*). Short-circuit retornando imediatamente quando a confiança for ≥ 90%.
2. **Captions density (VTT)** — baixar legendas automáticas, identificar o maior bloco contínuo (com *gap híbrido*: tenta `gap_tolerance=5s` primeiro; se o bloco resultante for implausível — menor que ~15min — refaz com `gap_tolerance=10s`). Confiança derivada da densidade de cues: `max(40, min(82, int(40 + density * 4)))`.
3. **Fallback `SKIPPED`** — se ambos os sinais falharem (sem chapters e sem legendas), a detection fica como `SKIPPED` com `error_message="sem_legendas_disponiveis"`; o editor ajusta timestamps manualmente no clip editor. **Sem retry automático** — resultado é determinístico.

**Critérios de Aceitação (V1):**
- AC-02.1: O sistema retorna timestamps de início e fim em ≥ 80% dos vídeos com legendas ou capítulos disponíveis (baseline observado no dataset: 3–5/10 hits).
- AC-02.2: O sistema exibe um indicador de confiança (%) junto aos timestamps sugeridos. O cap superior é **82%** (limite da fórmula sem IA) — alerta visual `< 80%` aparecerá na maioria dos casos, o que é honesto com o MVP.
- AC-02.3: Quando confiança < 80% ou status `SKIPPED`, o sistema habilita automaticamente o editor manual de timestamps e exibe mensagem de ação recomendada.
- AC-02.4: O tempo máximo para retornar os timestamps é 60 segundos após submissão da URL (geralmente 20–30s).
- AC-02.5: Vídeos sem chapters nem captions disponíveis são marcados como `SKIPPED` com mensagem clara; editor segue manualmente.

**Critérios para V2 (QS-75, backlog):**
- Precisão de ±2 min em ≥ 85% do dataset, com Whisper amostrado nas fronteiras + LLM refinando o bloco.
- Cap de confiança elevado para `≥ 95%` nos casos de alta certeza.

**Fixtures e dataset de validação:**
- `backend/app/modules/videos/tests/fixtures/reference_videos.json` — 10 vídeos com ground truth.
- `backend/scripts/detection_dataset.py` — script batch para rodar e comparar baseline.

**Falha:** Ver [EC-02](#ec-02--detecção-com-baixa-confiança-ou-falha-total).

---

### RF-03 — Download Otimizado do Segmento

**Descrição:** O sistema deve baixar apenas o trecho da live correspondente à pregação, na melhor qualidade disponível.

**Critérios de Aceitação:**
- AC-03.1: O download inclui apenas o segmento entre os timestamps confirmados (± 30 segundos de margem em cada extremo).
- AC-03.2: A qualidade mínima é 1080p. Se indisponível, usa a maior disponível e registra log de aviso.
- AC-03.3: O progresso de download é exibido em tempo real (barra de progresso com % e velocidade estimada).
- AC-03.4: O arquivo baixado é armazenado temporariamente e removido automaticamente após upload bem-sucedido.
- AC-03.5: Downloads acima de 2GB geram alerta ao editor antes de iniciar.

**Falha:** Ver [EC-03](#ec-03--falha-no-download).

---

### RF-04 — Corte Automático de Vídeo

**Descrição:** O sistema deve cortar o vídeo baixado nos timestamps confirmados, sem perda de qualidade.

**Critérios de Aceitação:**
- AC-04.1: O vídeo de saída começa exatamente no timestamp de início (tolerância de ±1 segundo).
- AC-04.2: O vídeo de saída termina exatamente no timestamp de fim (tolerância de ±1 segundo).
- AC-04.3: A qualidade de vídeo e áudio do arquivo de saída é idêntica ao arquivo de entrada (sem reencoding desnecessário).
- AC-04.4: O corte é feito em menos de 2 minutos para vídeos de até 90 minutos.

**Falha:** Ver [EC-04](#ec-04--falha-no-corte-de-vídeo).

---

### RF-05 — Upload para YouTube

**Descrição:** O sistema deve fazer upload automático do clip processado para o canal do YouTube da igreja, como último passo antes da revisão.

**Critérios de Aceitação:**
- AC-05.1: O vídeo é enviado como **`unlisted`** por padrão; o clip transiciona para `AWAITING_REVIEW` e **nunca** fica público automaticamente.
- AC-05.2: O upload inclui: arquivo de vídeo, título provisório (ou o `selected_title` se já salvo como rascunho), descrição provisória.
- AC-05.3: O upload utiliza a **Google Resumable Upload API**; o progresso é exibido em tempo real via polling do `get_clip_pipeline_service`.
- AC-05.4: Após upload bem-sucedido, `clips.youtube_video_id` e a URL pública são persistidos; a tela de revisão passa a conseguir embed do vídeo.
- AC-05.5: O sistema respeita os limites de quota da YouTube Data API v3 (10.000 unidades/dia); o contador `daily_quota_used` é incrementado por chamada e exibido no Settings/QuotaCard.
- AC-05.6: A autenticação usa **OAuth 2.0** com escopo **`youtube.force-ssl`** (necessário para `videos.update` em RF-07 e `videos.delete` em RF-10). Tokens são armazenados criptografados com AES-256 em `youtube_connections.access_token` e `refresh_token`.
- AC-05.7: Erro `insufficientPermissions` é mapeado como `YOUTUBE_INSUFFICIENT_SCOPE` e o frontend pede reconexão.

**Falha:** Ver [EC-05](#ec-05--falha-no-upload-para-o-youtube).

---

### RF-06 — Geração de Conteúdo com IA

**Descrição:** O sistema deve gerar automaticamente títulos, descrição e mensagem de WhatsApp para a pregação.

> **Status (2026-04-24):** ⏳ **Pendente**. Endpoints existem em `POST /clips/{id}/regenerate/{field}` (onde `field ∈ titles | description | whatsapp_message`) mas retornam **`501 Not Implemented`**. As colunas `generated_titles` (JSONB), `generated_description` e `generated_whatsapp_message` já estão persistidas em `clips`. O frontend apresenta placeholder *"Geração IA em desenvolvimento"*.
>
> **V1 (planejada, não implementada):** O design original previa LLM local (Ollama). Decidiu-se pular essa fase dada a complexidade e qualidade insuficiente observadas na detecção com IA local (vide QS-58). As issues [QS-59](https://linear.app/) (títulos), [QS-60](https://linear.app/) (descrição) e [QS-61](https://linear.app/) (WhatsApp) vão direto para LLM na nuvem.
>
> **V1.1 (planejado):** LLMs na nuvem (Gemini / OpenAI) com `OPENAI_API_KEY` já configurado em `app/core/config.py`.

**Critérios de Aceitação:**

**Títulos (RF-07a):**
- AC-07.1: O sistema gera exatamente 5 opções de título.
- AC-07.2: Cada título tem entre 50 e 60 caracteres.
- AC-07.3: Os títulos são variados: ao menos 1 com pergunta, 1 com versículo, 1 com palavra-chave de busca.
- AC-07.4: O editor seleciona 1 título; a seleção é refletida imediatamente no preview do YouTube.

**Descrição (RF-07b):**
- AC-07.5: A descrição segue template padronizado: resumo da pregação, pontos principais, versículos citados, hashtags, link do canal.
- AC-07.6: A descrição tem entre 300 e 500 palavras.
- AC-07.7: O editor pode editar a descrição em campo de texto livre antes de publicar.

**WhatsApp (RF-07c):**
- AC-07.8: A mensagem tem entre 100 e 150 palavras, em tom conversacional.
- AC-07.9: A mensagem inclui o link do vídeo no YouTube.
- AC-07.10: Botão "Copiar" copia a mensagem completa para a área de transferência com um clique.

**Falha:** Ver [EC-07](#ec-07--falha-na-geração-de-conteúdo).

---

### RF-07 — Interface de Revisão e Publicação

**Descrição:** O editor/admin deve conseguir revisar todo o conteúdo gerado e publicar o clip em uma única tela. Implementação concluída em QS-55 e refinada em QS-72 (integração em abas).

**Arquitetura de UI (QS-72):**
A tela de detalhes do clip fica em `/videos/[videoId]/clip/[clipId]?tab=edicao|processamento|revisao` com 3 abas:

| Aba | Conteúdo | Quando usar |
|---|---|---|
| **Edição** | Informações read-only do clip (criar novo clip = nova entidade) | Sempre disponível |
| **Processamento** | Pipeline stages (Download · Trim · Upload) com timestamps e retry inline | Enquanto `status ∈ {DOWNLOADING, TRIMMING, UPLOADING, ERROR}` |
| **Revisão** | Player YouTube embed + editor de título/descrição/WhatsApp + botões publicar/descartar | Default quando `status ∈ {AWAITING_REVIEW, PUBLISHED, DISCARDED}` |

**Critérios de Aceitação:**
- AC-08.1: A aba **Revisão** exibe: player do YouTube embed (quando `youtube_video_id` existe) ou player local (fallback via `stream-url`), seletor de título (radio group de 5 opções IA + opção manual), editor de descrição plain-text (textarea com contador ≤ 5000 chars), editor da mensagem de WhatsApp.
- AC-08.2: O botão "Publicar" só fica habilitado após o editor selecionar um título E a descrição estar preenchida.
- AC-08.3: Ao clicar "Publicar", o sistema exibe `AlertDialog` de confirmação com preview (título + 2 linhas da descrição) antes de executar. Executa **flush síncrono** do último rascunho antes do publish.
- AC-08.4: Após publicação bem-sucedida, a mesma URL vira read-only, exibe banner *"✓ Publicado"* com link público, botões de copiar link e copiar mensagem WhatsApp (este último passa a ficar habilitado).
- AC-08.5: **Rascunho com auto-save**: campos editáveis (`selected_title`, `description`, `whatsapp_message`) persistem automaticamente via `PATCH /clips/{id}/draft` com debounce de ~1s (hook `use-clip-autosave`). Editor pode retomar depois sem perder alterações.
- AC-08.6: **Permissões** (enforcement no backend via `require_role`):
  - `editor` — pode abrir tela, editar conteúdo, disparar "Enviar pra revisão" (upload).
  - `admin` — tudo do editor + publicar + descartar.
- AC-08.7: Estados `PUBLISHED` e `DISCARDED` renderizam a aba Revisão em modo read-only.
- AC-08.8: Botão "Regenerar" (títulos/descrição/WhatsApp) chama `POST /clips/{id}/regenerate/{field}` e, enquanto QS-59/60/61 retornam 501, exibe placeholder *"Geração IA em desenvolvimento"* sem bloquear o fluxo manual.

---

### RF-08 — Autenticação e Controle de Acesso

**Descrição:** O sistema deve ter autenticação segura e dois níveis de acesso.

**Critérios de Aceitação:**
- AC-09.1: Dois roles: `editor` (pode submeter, processar e revisar) e `admin` (idem + pode publicar e gerenciar usuários).
- AC-09.2: Sessão expira após 8 horas de inatividade.
- AC-09.3: Senhas armazenadas com hash bcrypt (custo ≥ 12).
- AC-09.4: Tentativas de login falhas são limitadas a 5 por 15 minutos (rate limiting).
- AC-09.5: Tokens OAuth do YouTube são armazenados criptografados (AES-256) no banco de dados.

---

### RF-09 — Dashboard e Rastreamento

**Descrição:** O sistema deve oferecer visibilidade do pipeline de produção.

> **Redesign v2 (PR #11, 2026-04-22):** dashboard foi remodelado com tema dark (`stone-950` + `amber-500`) e componentes primitivos próprios. Sidebar fixa 220px (sem hover-expand), topbar por página, NotificationsDrawer acessível pelo sino.

**Critérios de Aceitação:**
- AC-10.1: O dashboard exibe: hero greeting dinâmico + 3 MetricTiles (vídeos, clips publicados, visualizações totais) com sparklines de 30 dias + FeaturedCard (clip com mais views) + PipelineCard (stages do clip mais recente em processamento) + ActivityCard + QuotaCard radial.
- AC-10.2: Os status possíveis para **clips** são: `pending`, `downloading`, `trimming`, `ready`, `uploading`, `awaiting_review`, `published`, `discarded`, `error`. Os status agregados exibidos para **videos** são derivados das detections e dos clips filhos.
- AC-10.3: O status é atualizado via polling do React Query com `refetchInterval` condicional (3s quando há job ativo, 15s caso contrário) — sem necessidade de recarregar a página. SSE/WebSocket fica em QS-63.
- AC-10.4: Clips com status `error` exibem `error_code` e descrição, com botão **"Tentar novamente"** (`POST /clips/{id}/retry`).
- AC-10.5: A listagem de vídeos (`/videos`) tem paginação; filtros de clip (`ClipsMap` + FilterChips) estão na aba Clipes de cada vídeo.
- AC-10.6: A listagem `GET /clips` aplica cap de `page_size=100`; contagens agregadas usam paginação em lotes.

---

### RF-10 — Ciclo de Vida do Clip (QS-55 / QS-72)

**Descrição:** Um clip passa por estados bem definidos entre a criação e a publicação/descarte. Este RF define os estados, transições e regras.

**Máquina de estados do Clip:**

```
PENDING ──► DOWNLOADING ──► TRIMMING ──► READY ──► UPLOADING ──► AWAITING_REVIEW ──► PUBLISHED
   │             │              │           │           │                │
   └── ERROR ◄───┴──────────────┴───────────┴───────────┴────────────────┘
                                                                          │
                                                        DISCARDED ◄───────┘  (admin only, pré-publish)
```

**Regras:**
- AC-11.1: Todo clip nasce em `PENDING` e dispara o `DownloadAndTrimWorkflow` (Temporal).
- AC-11.2: O workflow persiste progresso a cada 5% via heartbeat; timeout do download é 2h, do trim é 10min.
- AC-11.3: Em `READY`, o clip já tem `file_path`, `duration`, `resolution` e pode ser streamado localmente (HTTP range requests via `GET /clips/{id}/stream`) e baixado pelo editor.
- AC-11.4: O upload para YouTube é **manual** — disparado pelo botão "Enviar pra revisão". Após o upload, clip entra em `AWAITING_REVIEW` (não `PUBLISHED`).
- AC-11.5: Erros em qualquer stage transicionam para `ERROR` com `error_code` (um de: `DOWNLOAD_FAILED`, `DOWNLOAD_TIMEOUT`, `TRIM_FAILED`, `TRIM_CORRUPTED`, `INVALID_TIMESTAMPS`, `VIDEO_UNAVAILABLE`). Retry inline via `POST /clips/{id}/retry`.
- AC-11.6: **Descartar clip**: permitido em qualquer status exceto `PUBLISHED`. Só `admin`. Durante pipeline ativo, cancela o workflow Temporal antes do soft delete. Se já havia upload, chama `videos.delete` no YouTube.
- AC-11.7: Deletar o `Video` pai remove em cascata todos os clips filhos (cascade no FK), limpando arquivos em `/data/clips/` e `/data/videos/`.
- AC-11.8: Edição pós-publicação **não** é suportada na V1 (clip `PUBLISHED` é read-only na UI e imutável no backend).

---

### RF-11 — Integração OAuth com YouTube

**Descrição:** O sistema deve gerenciar a conexão OAuth 2.0 com o canal do YouTube da igreja de forma resiliente.

**Critérios de Aceitação:**
- AC-12.1: O fluxo OAuth usa o escopo `https://www.googleapis.com/auth/youtube.force-ssl` (inclui `upload`, `videos.update` para mudança de privacy e `videos.delete` para descarte).
- AC-12.2: A conexão é armazenada em `youtube_connections` com `access_token` e `refresh_token` criptografados (AES-256).
- AC-12.3: O sistema atualiza `access_token` automaticamente quando expira, usando o `refresh_token`. Falha de refresh transiciona para estado que pede reconexão ao admin.
- AC-12.4: O contador `daily_quota_used` é incrementado por chamada que consome quota (upload = 1600, update = 50, delete = 50). `quota_reset_date` zera diariamente.
- AC-12.5: A UI exibe QuotaCard radial no dashboard e em `/settings` (seção Canais Conectados).
- AC-12.6: Desconectar o canal (`DELETE /connection`) apaga a connection mas mantém os uploads históricos (`youtube_uploads`).

---

## 7. Requisitos Não-Funcionais

### RNF-01 — Performance

| Requisito | Meta |
|---|---|
| Tempo de detecção de timestamps | < 60 segundos |
| Tempo de processamento (vídeo de 1h) | < 15 minutos |
| Tempo de carregamento de páginas | < 3 segundos |
| Latência de atualização de status | < 5 segundos |
| Tempo de resposta da API interna | < 500ms (p95) |

### RNF-02 — Confiabilidade

- Uptime mínimo de 95% (V1)
- Processamento com falha deve reiniciar automaticamente até 2 vezes antes de marcar como `erro`
- Nenhuma perda de dados de vídeo já processado por falha do sistema
- Logs de todas as etapas do pipeline armazenados por 30 dias

### RNF-03 — Segurança

- Comunicação HTTPS em todos os endpoints
- Dados em repouso criptografados (AES-256)
- Tokens OAuth nunca expostos em logs ou respostas de API
- Conformidade com LGPD: dados pessoais mínimos coletados, política de retenção clara
- Logs de auditoria para ações de publicação (quem publicou, quando)

### RNF-04 — Usabilidade

- Um novo editor consegue processar seu primeiro vídeo sem treinamento em menos de 10 minutos
- Interface responsiva: funciona em desktop e tablet (mínimo 768px de largura)
- Mensagens de erro são escritas em linguagem clara, sem jargão técnico, sempre com ação recomendada

### RNF-05 — Custo Operacional

- Custo total de APIs e infraestrutura < $50/mês
- V1 opera **sem chamadas pagas de LLM** (detecção MVP sem IA; geração IA ainda não implementada em QS-59/60/61)
- Quando QS-59/60/61 forem implementados em LLM na nuvem, definir limite de tokens por vídeo e monitorar custo
- Monitorar consumo de quota da YouTube API (upload = 1600, update = 50, delete = 50); alertar em ≥ 80% dos 10.000 units/dia

---

## 8. Fluxos de Erro e Edge Cases

### EC-01 — URL Inválida ou Inacessível

**Gatilhos:**
- URL não é do YouTube
- Vídeo foi removido ou tornado privado
- Vídeo está em conta bloqueada geograficamente
- Live ainda está ao vivo (não finalizada)

**Comportamento esperado:**

| Caso | Mensagem ao Usuário | Ação do Sistema |
|---|---|---|
| URL não é YouTube | *"URL inválida. Cole um link do YouTube."* | Bloqueia submissão |
| Vídeo removido/privado | *"Vídeo inacessível. Verifique se o link está correto e se o vídeo é público ou não-listado."* | Bloqueia submissão |
| Live ainda ao vivo | *"Este vídeo ainda está transmitindo ao vivo. Aguarde o fim da live para processar."* | Bloqueia submissão |
| Bloqueio geográfico | *"Não foi possível acessar este vídeo. Pode estar bloqueado na sua região."* | Bloqueia submissão |

---

### EC-02 — Detecção com Baixa Confiança ou Falha Total

**Gatilhos:**
- Culto com formato atípico (somente pregação, sem louvor)
- Múltiplos pregadores no mesmo culto
- Áudio de baixa qualidade dificultando análise
- Falha no modelo de detecção

**Comportamento esperado:**

| Caso | Mensagem ao Usuário | Ação do Sistema |
|---|---|---|
| Confiança 60–79% | *"Confiança baixa. Revise os timestamps sugeridos antes de continuar."* | Abre editor manual automaticamente; exibe timestamps sugeridos como ponto de partida |
| Confiança < 60% | *"Não conseguimos detectar a pregação automaticamente. Defina os timestamps manualmente."* | Abre editor manual sem sugestão automática |
| Falha total do modelo | *"Erro na detecção automática. Defina os timestamps manualmente."* | Registra erro no log; oferece editor manual |
| Múltiplos segmentos detectados | *"Detectamos mais de um possível trecho de pregação. Selecione o correto."* | Exibe lista de segmentos candidatos para o editor escolher |

**Editor manual de timestamps:**
- Player de vídeo com marcadores arrastáveis
- Campo de entrada manual de tempo (HH:MM:SS)
- Botões "Ir para início" e "Ir para fim" para verificação rápida
- Preview do frame no marcador atual

---

### EC-03 — Falha no Download

**Gatilhos:**
- Conexão de internet interrompida
- YouTube bloqueia o yt-dlp
- Vídeo muito grande (> 10GB)
- Disco cheio no servidor
- Timeout (> 30 minutos)

**Comportamento esperado:**

| Caso | Mensagem ao Usuário | Ação do Sistema |
|---|---|---|
| Conexão interrompida | *"Download pausado por falha de conexão. Tentando reconectar..."* | Tenta retomar até 3x com backoff exponencial |
| Bloqueio do yt-dlp | *"Não foi possível baixar o vídeo. Tente novamente em alguns minutos."* | Registra erro; notifica admin para atualizar yt-dlp |
| Disco cheio | *"Espaço em disco insuficiente. Entre em contato com o administrador."* | Registra erro crítico; notifica admin por email |
| Timeout | *"O download demorou mais que o esperado e foi cancelado. Tente novamente."* | Limpa arquivos parciais; libera o job da fila |
| Vídeo > 10GB | *"Vídeo muito grande para processar. Considere usar timestamps mais precisos para reduzir o segmento."* | Bloqueia download; sugere revisão dos timestamps |

---

### EC-04 — Falha no Corte de Vídeo

**Gatilhos:**
- Arquivo de vídeo corrompido após download
- Timestamps fora dos limites do vídeo
- Erro no FFmpeg

**Comportamento esperado:**

| Caso | Mensagem ao Usuário | Ação do Sistema |
|---|---|---|
| Arquivo corrompido | *"Erro no arquivo de vídeo. Tentando baixar novamente..."* | Deleta arquivo; reinicia download automaticamente (1x) |
| Timestamps inválidos | *"Os timestamps estão fora da duração do vídeo. Revise-os."* | Volta para tela de edição de timestamps |
| Erro no FFmpeg | *"Erro técnico no processamento. Tente novamente."* | Registra stack trace; marca job como `erro` |

---

### EC-05 — Falha no Upload para o YouTube

**Gatilhos:**
- Token OAuth expirado ou revogado
- Quota da API esgotada (10.000 unidades/dia)
- Arquivo de vídeo inválido para o YouTube
- Erro de rede durante upload

**Comportamento esperado:**

| Caso | Mensagem ao Usuário | Ação do Sistema |
|---|---|---|
| Token expirado | *"Sua conexão com o YouTube expirou. Clique aqui para reconectar."* | Redireciona para fluxo OAuth; mantém vídeo processado aguardando |
| Quota esgotada | *"Limite diário do YouTube atingido. O upload será retomado automaticamente amanhã."* | Agenda upload para 00:01 do dia seguinte; notifica editor |
| Erro de rede | *"Falha no envio. Tentando novamente..."* | Retoma upload de onde parou (resumable upload) até 3 tentativas |
| Formato inválido | *"O YouTube rejeitou o vídeo. Entre em contato com o administrador."* | Registra detalhes do erro da API; notifica admin |

---

### EC-06 — Falha na Geração de Conteúdo

**Gatilhos:**
- Modelo de IA local sem recursos suficientes
- Transcrição vazia ou com muito ruído
- Timeout na geração

**Comportamento esperado:**

| Caso | Mensagem ao Usuário | Ação do Sistema |
|---|---|---|
| Falha no LLM | *"Não conseguimos gerar os títulos automaticamente. Você pode digitá-los manualmente."* | Exibe campos editáveis em branco; não bloqueia o fluxo |
| Transcrição insuficiente | *"Pouco conteúdo para gerar descrição automática."* | Gera conteúdo mínimo com base nos metadados disponíveis |
| Timeout | *"A geração de conteúdo demorou mais que o esperado."* | Cancela geração; oferece campos manuais |

> **Princípio de design para erros:** nenhum erro deve bloquear completamente o fluxo. Sempre deve existir um caminho manual para que o editor possa continuar.

---

### EC-07 — Edge Cases de Vídeo

| Situação | Comportamento |
|---|---|
| Live com menos de 20 min | Aviso antes de processar; editor pode confirmar |
| Live com mais de 5 horas | Aviso sobre tempo de processamento estimado antes de iniciar |
| Vídeo já processado (URL duplicada) | *"Este vídeo já foi processado. Ver resultado anterior?"* com link |
| Pregação com mais de 2 horas | Aviso ao editor; processamento normal |
| Culto sem pregação identificável | Segue fluxo de detecção com baixa confiança (EC-02) |

---

## 9. Riscos e Dependências

### 9.1 Riscos

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|---|
| R1 | yt-dlp bloqueado pelo YouTube | Média | Alto | Monitorar updates; ter script de fallback; documentar processo de atualização |
| R2 | Quota da YouTube API insuficiente | Baixa | Alto | Monitorar consumo; implementar scheduler para respeitar limites; solicitar aumento de quota se necessário |
| R3 | Precisão de detecção < 80% | Média | Médio | Editor manual sempre disponível; coletar correções para melhorar modelo |
| R4 | Hardware insuficiente para LLM local (V1) | Média | Alto | Definir requisitos mínimos de hardware antes do deploy; testar em máquina equivalente à do editor; ter fallback para campos manuais |
| R4b | Custo de APIs de LLM na nuvem acima do orçamento (V2) | Baixa | Médio | Monitorar consumo; definir limite de tokens por vídeo; avaliar Gemini vs ChatGPT por custo-benefício antes de migrar |
| R5 | Mudança nos ToS do YouTube | Baixa | Alto | Monitorar comunicados; manter advogado/consultor de ToS |
| R6 | Baixa adoção pelos editores | Média | Alto | Beta com Carlos antes do lançamento; onboarding guiado no primeiro uso |

### 9.2 Dependências Externas

| Dependência | Uso | Risco | Alternativa |
|---|---|---|---|
| YouTube Data API v3 (scope `youtube.force-ssl`) | Upload, `videos.update` (publish), `videos.delete` (discard), fetch de stats | Mudança de quota/ToS; `insufficientPermissions` se scope reduzido | Upload manual como fallback de último recurso; reconexão OAuth |
| yt-dlp + yt-dlp-ejs (Node.js runtime) | Download de vídeos, metadados, chapters, captions VTT | Bloqueio pelo YouTube; necessidade de atualizar runtime JS | Atualização frequente; comunidade ativa |
| FFmpeg 6+ | Corte de vídeo (stream copy) | Estável, baixo risco | — |
| Temporal | Orquestração de workflows (download/trim/upload/detection) | Dependência operacional (Temporal server + DB) | Fallback impossível no curto prazo — core do pipeline |
| LLMs na nuvem (OpenAI, Gemini) | Geração de conteúdo — **V1.1** (QS-59/60/61) | Custo por chamada | Fallback para campos manuais (já implementado) |
| Whisper (OpenAI API ou local) | Refinamento de detecção de timestamps — **V2** (QS-75) | Custo / recursos de hardware | MVP sem IA já em produção (QS-58) |

---

## 10. Roadmap

### Fase 1 — MVP (Concluída / em validação — 2026-04)
**Objetivo:** Fluxo completo funcional, mesmo que parcialmente manual

- [x] Infraestrutura base — PostgreSQL + Temporal + Docker Compose
- [x] Autenticação e roles (QS-57)
- [x] Submissão de URL e validação (QS-51)
- [x] Download via yt-dlp + corte com FFmpeg (QS-52, otimização 6x em QS-71)
- [x] Upload para YouTube via API com scope `youtube.force-ssl` (QS-54)
- [x] Interface de revisão e publicação (QS-55)
- [x] Remodelagem da página de detalhes do clip com abas (QS-72)
- [x] Dashboard redesign v2 (PR #11)
- [x] Detecção automática de timestamps — MVP sem IA (QS-58)

**Critério de conclusão:** Editor consegue processar um vídeo do início ao fim sem assistência técnica. ✅ **Atingido.**

---

### Fase 1.1 — Geração de conteúdo com IA (Em aberto)
**Objetivo:** Reduzir o trabalho manual de título/descrição/WhatsApp

- [ ] QS-59 — Geração de 5 títulos com LLM na nuvem
- [ ] QS-60 — Geração de descrição estruturada (≤ 5000 chars)
- [ ] QS-61 — Geração de mensagem WhatsApp (100–150 palavras)

**Critério de conclusão:** ≥ 50% dos clips publicados sem edição manual de título/descrição.

---

### Fase 2 — Melhorias de detecção e tempo real (Q3 2026)
**Objetivo:** Elevar a qualidade da detecção e reduzir fricção operacional

- [ ] QS-75 — Refinamento de detecção com Whisper + LLM (viabilidade e integração)
- [ ] QS-63 — Notificações em tempo real via SSE/WebSocket
- [ ] UI de gestão de usuários (backend já existe)
- [ ] Endpoint de `videos.update` pós-publicação (editar título/descrição já público)

**Critério de conclusão:** Precisão de detecção de ±2 min em ≥ 85% do dataset; notificações ao vivo funcionando.

---

### Fase 3 — Qualidade e Polimento
**Objetivo:** Sistema estável e pronto para uso contínuo

- [ ] Processamento em lote (fila)
- [ ] Analytics agregadas (views totais, performance por período)
- [ ] Cleanup automático de arquivos locais pós-upload
- [ ] Testes de carga e otimização
- [ ] Documentação de usuário

**Critério de conclusão:** NPS ≥ 30 após 4 semanas de uso real.

---

## 11. Glossário

| Termo | Definição |
|---|---|
| Pregação | Momento do culto onde o pastor expõe um tema bíblico, geralmente 30–60 minutos |
| Louvor | Momento de adoração musical no culto, geralmente antes da pregação |
| Live | Transmissão ao vivo no YouTube |
| Timestamp | Marcador de tempo em vídeo no formato HH:MM:SS |
| Video | Entidade que representa a live original submetida pelo editor. Agrupa clips. |
| Clip | Segmento da pregação extraído da live (tem `start_time`, `end_time` e ciclo de vida próprio) |
| VideoDetection | Registro do resultado da detecção automática de timestamps (tabela separada, com status próprio e fases em JSONB) |
| Versículo | Referência a texto bíblico (ex: João 3:16) |
| Pipeline | Sequência de etapas automatizadas de processamento (Download · Trim · Upload) |
| Temporal | Framework de durable execution usado para orquestrar os workflows do pipeline |
| Workflow | Orquestração Temporal (ex.: `DownloadAndTrimWorkflow`, `DetectSermonTimestampsWorkflow`, `UploadToYouTubeWorkflow`) |
| Activity | Operação síncrona/assíncrona executada dentro de um workflow Temporal (ex.: `detect_chapters_activity`) |
| yt-dlp | Ferramenta open-source de download de vídeos do YouTube. V1 usa também `yt-dlp-ejs` (runtime Node.js) |
| Whisper | Modelo de reconhecimento de voz da OpenAI — **reservado para V2 (QS-75)**, não usado na V1 |
| OAuth | Protocolo de autorização usado para integrar com o YouTube; scope V1 = `youtube.force-ssl` |
| Quota | Limite de chamadas à YouTube Data API (10.000 unidades/dia) — upload = 1600, update = 50, delete = 50 |
| Unlisted | Visibilidade de vídeo no YouTube: acessível por link, não aparece em buscas — padrão pós-upload |
| Public | Visibilidade final após publish — acessível e pesquisável |
| Private | Visibilidade que **bloqueia embed** — não usado pelo sistema (embed depende de unlisted ou public) |
| LLM | Large Language Model — usado para gerar títulos/descrições (QS-59/60/61, V1.1, na nuvem) |
| Rascunho (draft) | Edições feitas pelo usuário na tela de revisão, persistidas com auto-save debounce ~1s |

---

## Apêndice A — Changelog (2026-04)

Mudanças aplicadas a este PRD em 2026-04-24 para refletir o estado real da implementação:

| Seção | Mudança principal |
|---|---|
| Topo | Versão 2.0 → **2.1**; status passou de "Em Revisão" para "MVP em implementação avançada" |
| 4.1 Escopo V1 | Adicionada coluna de **Status** (✅ / 🔄 / ⏳) e referência à issue/PR de cada item |
| 4.3 Roadmap | Geração IA movida para **V1.1** (decisão: pular LLM local e ir direto para cloud); QS-75 para V2 |
| 5.0 (nova) | Seção de **Modelo de Domínio** introduzindo `Video`/`VideoDetection`/`Clip` como entidades separadas; nota sobre `video.status` ser dead state |
| 5.1 Fluxo principal | Diagrama atualizado: separação Video → Detection → Clip → Upload → Review; upload como passo manual ("Enviar pra revisão"); publicação só pelo admin |
| RF-02 | Reescrito para **MVP QS-58** (chapters + captions density + gap híbrido 5s/10s + SKIPPED). Cap de confiança em 82% explicitado. Baseline esperado 3–5/10. IA movida para QS-75 na V2 |
| RF-05 | Upload como `unlisted` + **scope `youtube.force-ssl`** (antes era `youtube.upload`). Quota por tipo de chamada explicitada. AES-256 para tokens |
| RF-06 | Marcado como ⏳ Pendente (endpoints retornam 501). V1 **sem** LLM local — QS-59/60/61 vão direto para cloud (V1.1) |
| RF-07 | Reescrito com arquitetura de 3 abas (QS-72), auto-save debounce 1s, permissões editor vs admin, `AlertDialog` de confirmação com flush síncrono |
| RF-09 | Dashboard atualizado com redesign v2 (PR #11): MetricTiles, PipelineCard, sidebar 220px fixa, polling condicional |
| **RF-10 (novo)** | Ciclo de vida do clip com máquina de estados (9 estados + ERROR + DISCARDED) e regras de retry/discard |
| **RF-11 (novo)** | Integração OAuth com YouTube: scope, armazenamento criptografado, refresh automático, quota tracking |
| RNF-05 | Removida menção a "LLM local" como economia — V1 opera **sem** chamadas pagas de LLM |
| 9.2 Dependências | Ollama/LLM local removidos do V1; Temporal explicitado como dependência core; yt-dlp-ejs adicionado |
| 10 Roadmap | Fase 1 marcada como concluída; Fase 1.1 criada para IA generation; Fase 2 traz QS-75 e QS-63 |
| 11 Glossário | Adicionados termos Temporal, Workflow, Activity, Video, Clip, VideoDetection, Unlisted, Public, Private, Rascunho |

> Essas mudanças **não** alteram a visão de produto nem os objetivos de negócio (seções 1 e 2). Refletem escolhas de execução tomadas durante a implementação (especialmente QS-58, QS-54, QS-55, QS-72 e PR #11).

---

**PRD — Sistema de Clips de Pregações**
**Versão:** 2.1 | **Público:** Time de Desenvolvimento | **Status:** MVP em implementação avançada
