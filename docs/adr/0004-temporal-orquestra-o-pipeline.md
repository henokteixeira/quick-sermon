---
status: accepted
date: 2026-03-21
---

# Temporal orquestra o Pipeline e é a única via entre módulos

Download, Corte, Upload e Detecção rodam como workflows Temporal com uma activity por etapa, heartbeat, timeouts e retries; os módulos do backend nunca se importam entre si e só conversam por activities. Escolhemos Temporal em vez de Celery, RQ ou tarefas em segundo plano do FastAPI porque um Download de até duas horas precisa de retomada, heartbeat de progresso, retry e cancelamento (Descartar cancela o workflow em andamento), e a interface do Temporal serve de inspeção sem código extra.

## Consequences

- Temporal e seu Postgres dedicado são dependências obrigatórias do compose; não existe caminho síncrono para criar um Clip nem para detectar uma Pregação.
- O worker é um processo separado da API e precisa estar vivo para qualquer etapa do Pipeline acontecer.
- Todo trabalho que cruza módulos (por exemplo, a Detecção no módulo de vídeos alimentando a criação de Clips) passa por activities, nunca por importação direta.
