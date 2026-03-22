# PRD — KAI-51: Submissao de URL e Validacao

## Milestone: Fase 1 — MVP | Prioridade: Urgente

---

## 1. Contexto

A submissao de URL e o ponto de entrada de todo o pipeline de processamento de videos. Sem ela, nenhuma outra etapa (download, corte, upload, geracao de conteudo) pode funcionar. Esta task implementa o RF-01 do PRD principal e cria a base do modulo de videos que sera usado por todas as tasks subsequentes (KAI-52, KAI-53, KAI-54).

### Dependencias

- **Depende de (Done):** KAI-50 (Infraestrutura base), KAI-57 (Autenticacao e roles)
- **Bloqueia:** KAI-52 (Download via yt-dlp), KAI-58 (Deteccao de timestamps)

---

## 2. Objetivo

Permitir que o editor submeta uma URL do YouTube e receba feedback imediato sobre a validade do link, com preview do video (titulo, duracao, thumbnail). O sistema deve detectar URLs duplicadas, validar formatos aceitos, e persistir o video no banco com status `pending`.

---

## 3. Escopo

### Incluido

| Funcionalidade | Descricao |
|---|---|
| Formulario de submissao de URL | Campo de texto + botao "Processar" |
| Validacao de formato de URL | Aceita: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/live/` |
| Busca de metadados do YouTube | Titulo, duracao, thumbnail via yt-dlp (sem download do video) |
| Preview do video | Exibe titulo, duracao e thumbnail antes de confirmar |
| Aviso de video curto | Alerta se duracao < 20 min, com confirmacao |
| Deteccao de URL duplicada | Se ja foi submetida, exibe link para o video existente |
| Persistencia no banco | Cria registro na tabela `videos` com status `pending` |
| Listagem de videos | Tabela com todos os videos submetidos (titulo, status, data) |
| Pagina de detalhes do video | Exibe informacoes do video individual |
| Protecao por autenticacao | Apenas usuarios logados podem submeter |

### Fora do Escopo

- Download do video (KAI-52)
- Deteccao de timestamps (KAI-58)
- Corte de video (KAI-53)
- Upload para YouTube (KAI-54)
- Processamento em lote (KAI-64)
- Verificacao se video e live (ao vivo vs finalizada) — sera tratado na V2 com integracao YouTube Data API

---

## 4. Personas Impactadas

- **Editor (Carlos)**: Submete a URL apos o culto, precisa de feedback rapido sobre a validade e preview do video
- **Admin (Pastora Ana)**: Pode ver todos os videos submetidos no dashboard

---

## 5. User Stories

### US-01: Submissao de URL valida

**Como** editor, **quero** colar uma URL do YouTube **para** iniciar o processamento da pregacao.

**Criterios de Aceitacao:**
- AC-01.1: Campo de URL aceita formatos: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/live/`
- AC-01.2: Apos submissao, sistema exibe preview com titulo, duracao e thumbnail em ate 5 segundos
- AC-01.3: Editor pode confirmar e o video e salvo com status `pending`
- AC-01.4: Apos confirmacao, redireciona para a pagina de detalhes do video

### US-02: Rejeicao de URL invalida

**Como** editor, **quero** receber feedback claro quando insiro uma URL invalida **para** corrigir antes de tentar novamente.

**Criterios de Aceitacao:**
- AC-02.1: URL que nao seja do YouTube exibe: "URL invalida. Cole um link do YouTube."
- AC-02.2: URL com formato incorreto exibe mensagem especifica
- AC-02.3: O botao "Processar" fica desabilitado enquanto a URL nao for valida
- AC-02.4: Video inacessivel (privado/removido) exibe: "Video inacessivel. Verifique se o link esta correto."

### US-03: Deteccao de duplicata

**Como** editor, **quero** ser avisado se ja submeti este video **para** nao duplicar trabalho.

**Criterios de Aceitacao:**
- AC-03.1: Se a URL ja existe no banco, exibe: "Este video ja foi submetido."
- AC-03.2: Mensagem inclui link para o video existente
- AC-03.3: Nao cria registro duplicado

### US-04: Aviso de video curto

**Como** editor, **quero** ser avisado se o video tem menos de 20 minutos **para** confirmar que realmente quero processar.

**Criterios de Aceitacao:**
- AC-04.1: Video com duracao < 20 min exibe: "Video muito curto para conter uma pregacao — deseja continuar?"
- AC-04.2: Editor pode confirmar ou cancelar
- AC-04.3: Se confirmar, o video e salvo normalmente

### US-05: Listagem de videos

**Como** editor, **quero** ver todos os videos que submeti **para** acompanhar o status de cada um.

**Criterios de Aceitacao:**
- AC-05.1: Tabela exibe: thumbnail, titulo, status, data de submissao, editor responsavel
- AC-05.2: Status mostrado com badge colorido (pending=amarelo, processing=azul, error=vermelho, etc.)
- AC-05.3: Clicar em um video abre a pagina de detalhes
- AC-05.4: Paginacao para listas grandes

---

## 6. Requisitos Nao-Funcionais

| Requisito | Meta |
|---|---|
| Tempo de busca de metadados | < 5 segundos |
| Tempo de resposta da API | < 500ms (exceto busca de metadados) |
| Validacao de URL | Client-side + server-side |

---

## 7. Metricas de Sucesso

| Metrica | Meta |
|---|---|
| Taxa de submissao com sucesso | >= 95% das URLs validas |
| Tempo medio de feedback ao editor | < 5 segundos |
| Duplicatas evitadas | 100% (zero duplicatas no banco) |

---

## 8. Dependencias Tecnicas

- **yt-dlp** para extracaco de metadados (ja no Docker)
- **PostgreSQL** para persistencia (ja configurado)
- **Auth system** para protecao de rotas (KAI-57, Done)
