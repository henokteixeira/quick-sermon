# Handoff: Frontend Redesign v2 (stone‑950 + amber + DM Serif)

**Data:** 2026-04-22
**Status:** em andamento — telas principais prontas, pendências em telas secundárias

## 1. Objetivo

Implementar o redesign completo do frontend Next.js do Quick Sermon a partir de dois bundles de handoff do Claude Design (v1 em `frontend/redesing/` e v2 em `/tmp/qs-redesign-v2/`). A linguagem visual é **stone‑950 warm + amber‑500 + DM Serif Display**, com AppShell (sidebar + topbar) e primitivos unificados. Objetivo é sair de um frontend com tema misto (light no dashboard, dark só em auth) e entregar UI coerente e fiel aos protótipos, preservando toda a lógica existente (mutations, queries, autoguard).

## 2. Contexto essencial

- **Stack**: Next.js 14 App Router · React 18 · TypeScript strict · Tailwind (tokens via CSS vars) · shadcn/ui · TanStack Query v5 · Zustand · next-intl (pt-BR) · lucide-react.
- **Escopo decidido**: 9 páginas (auth × 2, dashboard, videos list, video detail, clip editor, clip detail, settings, users) + `/notifications` (novo). Não tocamos Onboarding, Pipeline como rota própria, ou Forgot Password.
- **Estratégia de componentes**: manter `components/ui/` (shadcn) e criar primitivos customizados em `components/features/ui/` para fidelidade ao protótipo (AmberGlow, MetricTile, Waveform, StatusBadge, PipelineStrip, ClipsMap, DownloadMenu, Btn, Tab, InfoTile, FilterChip, AuthField, PasswordStrength, Logomark, StatusDot, PageTopbar, ThumbPlaceholder, VideoRow, Sparkline).
- **Tema dark default**: `html` recebe `className="dark"`; `.dark` no `globals.css` contém o namespace qs (qs-bg, qs-amber, qs-fg-muted, etc).
- **Max‑width fluido**: pages **não** usam mais `max-w-[1040px]`. Ocupam toda a largura do `<main>`. Sidebar fica fixa em **220px expandida** (sem hover) para compensar e evitar conteúdo esticado.
- **Backend relevante**:
  - `GET /clips` faz cap em `page_size=100` (valida `le=100`). Pedir 500 resulta em 422 silencioso.
  - `video.status` é **dead state** — nunca transiciona de PENDING. Fontes reais: `VideoDetection.status` e agregado de `Clip.status`.
  - Endpoints existentes já suportam tudo que a UI precisa (`listClips`, `listVideos`, `getDetection`, `getClipStreamUrl`, `getClipYouTubeStats`, `getClipPipeline`, `getClipProgress`, `getYouTubeQuota`, etc).

## 3. O que já foi feito

Cronológico, agrupado por bloco:

### Fundação
- `app/layout.tsx`: `<html className="dark">` + `bg-background text-foreground` no body.
- `app/globals.css`: realinhei o `.dark` aos hex exatos do `tokens.jsx`; adicionei `--bg-subtle`, `--line-strong`, `--amber-bright`, `--amber-deep`. Keyframes `qs-ping`/`qs-fade-in`/`qs-shimmer` + utility `.qs-scroll`.
- `tailwind.config.ts`: namespace `qs.*` completo, `boxShadow.amber-glow`, `animation.qs-ping`, `fontFamily.mono`.

### Layouts
- `app/(dashboard)/layout.tsx`: sidebar sticky `h-screen` **fixa em 220px** (sem hover‑expand) + topbar removido do layout (cada page renderiza seu próprio `<PageTopbar>`) + `NotificationsDrawer` no final.
- `app/(auth)/layout.tsx`: AuthShell com 2 AmberGlow + logo + centered 380px.

### Primitivos criados em `components/features/ui/`
`amber-glow`, `logomark` (com shrink‑0 + minWidth/minHeight pra não distorcer), `status-badge` (10 estados), `status-dot`, `sparkline`, `metric-tile`, `waveform` (Mini + Large com handles, seleção, playhead), `filter-chip` (count inline), `auth-field`, `password-strength`, `pipeline-stage`, `pipeline-strip` (compact), `thumb-placeholder` (aceita `imageUrl` e `videoUrl` como fallback), `video-row`, `section-header`, `btn` (5 variantes × 3 sizes), `tab`, `info-tile`, `download-menu` (dropdown), `clips-map` (waveform + markers por status + playhead + legenda), `page-topbar` (sticky com bell clicável, search, title, subtitle, action).

### Páginas
- **`/login`, `/register`** — AuthField + PasswordStrength reativo + Btn primary com shadow âmbar.
- **`/dashboard`** — hero greeting dinâmico + 3 MetricTiles (um accent, sparklines reais para published), FeaturedCard, PipelineCard (stages reais via `getClipPipeline`), ActivityCard, QuotaCard radial SVG. Featured agora é **o clipe com mais views** (useQueries em todos os published, ordena por `view_count`).
- **`/videos`** — sem filter chips (vídeo não tem status útil), sem "Data", apenas lista fluida com paginação. `VideoRow` mostra só `N clipes` (count real via `listClips` paginado em lotes de 100).
- **`/videos/[id]`** — back link, título serif, StatusBadge + submissão; tabs "Detalhes | Clipes"; actions **mudam por aba** (Detalhes → DownloadMenu+Renomear+Excluir; Clipes → Baixar tudo + Detectar novamente); player striped + DetectionCard (sparkle + confidence badge + WaveformMini + CTAs); 4 InfoTiles.
- **Aba Clipes (`ClipList`)** — `ClipsMap` (waveform + markers coloridos por status) + filter chips (Todos · Publicados · Em revisão · Prontos · Processando · Descartados) + lista de `ClipItem` fiéis ao protótipo (título serif 16px + StatusBadge + timecode + quality pill + meta inline + ações contextuais por status + thumbnail via vídeo pai com fallback via `getClipStreamUrl` → `<video>` HTML5 `#t=0.5`). Cards clicáveis com fix de stacking (`pointer-events-none` no conteúdo, `pointer-events-auto` nas actions).
- **`/videos/[id]/clip/new`** — header + detection suggestion card (purple) + grid 1fr+300px: left (player YouTube + timeline + markStart/markEnd) | right (**transport −10s/Play/+10s na sidebar, acima de Trecho**) + Trecho com nudge buttons + Exportação + Criar clip.
- **`/videos/[id]/clip/[clipId]`** — **sem tabs** (tela única, como v2 do protótipo); DetailHeader com back link "← Voltar para [nome]" (não mais breadcrumb); PipelineStrip quando processando (com "Ver completo" abrindo Dialog com `ProcessamentoTab`); RevisaoTab com layout `380px_1fr` (preview + DetailsCard + SourceCard à esquerda · TitleSelector AI purple + DescriptionEditor + WhatsappEditor verde‑tint à direita).
- **`/settings`** — side nav 220px (Perfil ativo, Canais conectados, IA, Notificações, Plano, Equipe + Sair danger); seções; ComingSoon para as não‑backed; DangerZone.
- **`/users`** — 4 StatTiles (accent no "Convites") + filter chips por role + search + table com avatar+email+role badge+StatusBadge+lastActivity. Dados mockados (backend sem endpoint `/users`).
- **`/notifications`** (novo) — PageTopbar + filter chips (Todas · Não lidas · Clips · Sistema · Equipe) + lista agrupada por data (Hoje · Ontem · Esta semana · Anteriores) em single card com dividers.

### Feature específica: notificações
- `lib/types/notification.ts` — tipos.
- `lib/stores/notifications-store.ts` — Zustand com 9 notificações mockadas + `isDrawerOpen`, `markAsRead`, `markAllAsRead`; helpers `groupByDate`, `formatRelativeShort`.
- `components/features/notifications/notification-item.tsx` — item com config por tipo (7 paletas), grupo.
- `components/features/notifications/notifications-drawer.tsx` — drawer flutuante 400px com header+tabs+lista+footer, fechar com ESC ou scrim.
- Bell da `PageTopbar` vira botão que toggle o drawer e só mostra o dot âmbar quando há `unreadCount > 0`.

### Infra i18n
- `messages/pt-BR.json`: normalizei `"newVideo": "Novo vídeo"` (minúsculo). Todos os pontos que antes tinham `"Novo vídeo"` hardcoded agora usam `tVideos("newVideo")`.

## 4. Estado atual

- **Type‑check**: `npx tsc --noEmit` → 0 erros.
- **Lint**: `npm run lint` → 0 erros, 1 warning pré‑existente em `create-clip-form.tsx` (useMemo em `formats`).
- **Build**: passou na última verificação (12/12 rotas geradas).
- **Dev server**: sobe em <1s.

**Funciona**:
- Todas as 9 páginas em escopo renderizam.
- Notificações drawer + página funcionam end‑to‑end (mockado).
- Contagem de clipes nos cards de vídeo atualiza automaticamente (paginação + prefix‑invalidate `["clips"]`).
- Thumbnail do clipe: YouTube → frame do stream local → striped fallback.
- Featured clip = mais views.
- Sidebar 220px fixa + conteúdo fluido.

**Conhecidos/aceitáveis**:
- `"Baixar tudo"` e `"Detectar novamente"` no header do vídeo (aba Clipes) e `"Preferências"` em `/notifications` são **placeholders** sem ação.
- Métricas de `/dashboard` (MetricTiles) para "Visualizações totais" mostram `—` (sem endpoint de analytics).
- `/users` usa dados **mockados** — backend não expõe `/users`.
- Settings: seções AI, Notificações, Plano, Equipe mostram `ComingSoon`.
- `video.status` é dead state no backend (documentado, não corrigido).

## 5. Próximos passos

Ordenados por prioridade percebida:

1. **Wire up "Detectar novamente"** na aba Clipes → já existe `retryDetection(videoId)` em `lib/api/detection.ts`. Só ligar no `onClick`.
2. **"Baixar tudo"** — decidir comportamento: baixar clipes um a um em abas novas, ou endpoint batch no backend? Hoje é placeholder.
3. **Editor de clip — Transcript lateral** (coluna esquerda): o protótipo v2 `screens-editor.jsx` tem uma aba de transcrição colapsável à esquerda. Não implementei. Requer: (a) endpoint backend que exponha segments sincronizados, (b) UI para highlight durante playback.
4. **Settings**: mover o `DangerZone` para ser específico de cada seção (hoje aparece em todas). E fazer a seção **Canais** realmente agrupar vários canais se houver mais de um.
5. **Preferências de notificação** (botão de Preferências em `/notifications`) — decidir se é modal, seção dentro de Settings, ou drawer.
6. **Persistência das notificações mockadas** — hoje resetam ao reload. Se for útil para demo, persistir no `localStorage` via `persist` middleware do Zustand.
7. **Pipeline como rota**: atualmente `/pipeline` está desabilitado na sidebar. O protótipo tem tela cheia. Se valer a pena, criar `/pipeline/page.tsx` com PipelineJobsScreen (há no bundle v2 `screens-pipeline.jsx`).
8. **Onboarding / Forgot Password** — 4 passos + 3 passos nos bundles. Ambos têm proto completo. Escopo futuro.
9. **Verificar fidelidade em telas que ainda não tiveram feedback** — o usuário validou Video list, Video detail, Clip detail, Dashboard. Faltaram pente‑fino: `/login`, `/register`, `/settings`, `/users`, `/notifications`, `/videos/[id]/clip/new`.

## 6. Perguntas em aberto

- O "Pipeline" na sidebar faz sentido ficar disabled ou deve virar uma rota real? O user mencionou que queria um **PipelineSummary** dentro da página do clip (já implementado como `PipelineStrip`), então talvez `/pipeline` não seja prioridade.
- Views no MetricTile do dashboard — fazer soma via `useQueries(getClipYouTubeStats)` para cada clip publicado (como fiz no Featured) ou deixar placeholder até backend expor agregado?
- "Baixar tudo" deve baixar só `ready`+`published`, ou também os `awaiting_review`? Hoje o botão desabilita se só houver `awaiting_review`.
- `video.status` → corrigir no backend (transicionar durante workflow) ou manter derivação no frontend? Hoje nem uma nem outra — o VideoRow só mostra count.

## 7. Artefatos relevantes

**Bundles de design** (read‑only):
- `frontend/redesing/` — v1 original (versão de Apr 8).
- `/tmp/qs-redesign-v2/quick-sermon/` — v2 atual (Apr 21). Principal diferença: shell com `maxContentWidth` + ab clipes alinhada com Detalhes.
- `/tmp/qs-redesign-v2/quick-sermon/chats/chat1.md` — transcript completo da conversa de design (25k palavras), útil para entender decisões (mostra que decidiram 1040 como max antes de eu remover).

**Arquivos críticos** (todos em `frontend/`):
- `app/layout.tsx`, `app/globals.css`, `tailwind.config.ts`
- `app/(auth)/layout.tsx`, `app/(dashboard)/layout.tsx`
- `components/features/ui/*` — primitivos
- `components/features/notifications/*` — drawer e item
- `components/features/clip-detail/detail-header.tsx` — back link simples (não breadcrumb)
- `components/features/clips/clip-list.tsx` — filter chips + ClipsMap + cards com fallback thumb
- `components/features/videos/video-list-table.tsx` — pagination em lotes de 100 para contagem
- `lib/stores/notifications-store.ts` — mock data
- `lib/types/notification.ts`
- `messages/pt-BR.json` — "newVideo": "Novo vídeo" (minúsculo)

**Comandos úteis**:
```bash
cd frontend
npx tsc --noEmit              # 0 erros esperados
npm run lint                  # 1 warning pré-existente
npm run dev                   # :3000 (ou :3001/3002 se ocupado)
npm run build                 # 12 rotas
```

**Plano original** (para contexto histórico):
- `/Users/henok/.claude/plans/read-the-attached-frontend-redesing-logical-quiche.md`

## 8. Instruções pra próxima sessão

- **Tom**: direto, sem sumários longos. O usuário itera rápido e dá feedback pontual (ex: "botão maior que nos outros", "o link não abre"). Resposta curta com file:line + o que mudou.
- **Sempre rode** `npx tsc --noEmit` + `npm run lint` antes de reportar "pronto".
- **Evite** criar handlers ou componentes genéricos por antecipação — só o que o usuário pediu. Três linhas similares é melhor que uma abstração prematura.
- **Sobre fidelidade**: o usuário valoriza pixel‑perfect. Quando ele aponta "não ficou igual", reler o `screens-*.jsx` do protótipo antes de codar — diferenças em 2px de padding importam. Use a v2 (`/tmp/qs-redesign-v2/`) como referência, não a v1.
- **Não re‑introduzir** `max-w-[1040px]` nas pages — decidimos fluido + sidebar 220px como compensação.
- **Invalidations de clipe**: use sempre `invalidateQueries({ queryKey: ["clips"] })` (prefix). Isso pega `["clips", videoId]`, `["clips", "__counts__"]`, `["clip-pipeline", ...]`, etc.
- **Backend caps `page_size=100`**. Para datasets maiores, paginar client‑side como fiz em `video-list-table.tsx`.
- **Armadilhas específicas**:
  - Logomark precisa de `shrink-0` + `minWidth/minHeight` inline — senão flex parent estica verticalmente.
  - Card clicável com actions dentro: `<Link absolute inset-0 z-[1]>` + conteúdo com `pointer-events-none` + actions `relative z-[2] pointer-events-auto`.
  - next-intl: sempre importar `useTranslations` e usar namespaces existentes no `pt-BR.json`. Se criar texto novo, adicionar no JSON em vez de hardcodar.
- **Thumbnail de clipe**: cascata é `video.thumbnail_url` (YouTube) → `getClipStreamUrl(clip.id)` via `<video>` HTML5 → striped. A query do stream URL é `["clip-stream-url", clip.id]` com `enabled: !thumbnailUrl && !!clip.file_path`.
- Se o usuário pedir "analise essa tela" ou "faz pente fino", fazer diff cirúrgico contra o `.jsx` do protótipo correspondente em `/tmp/qs-redesign-v2/quick-sermon/project/components/`. Nunca supor — ler o código original.
