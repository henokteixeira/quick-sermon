# Quick Sermon

Plataforma web que automatiza o pipeline de processamento de vídeos de pregações, da URL da Live ao vídeo publicado no YouTube.

## Rodando comandos

Backend e testes do backend rodam **dentro do Docker**, nunca no host: use os alvos do `Makefile`, não `python`/`pytest` diretamente.

- Backend: `pip` (`requirements.txt`, `requirements-dev.txt`).
- Frontend: `npm` (`package-lock.json`).

## Alvos fora do padrão

- `make setup` — gera o `.env` com segredos aleatórios.
- `make smoke` — sobe um clone limpo e prova a subida com dois comandos.
- `make lint` — roda ruff e eslint, ambos dentro do container.
- `make check-hygiene` — verifica a higiene do repositório.
- `make check-readme` — verifica que o README não promete o que não existe.
- `make test-setup` — testa o script de setup do `.env`.

## Testes do backend

pytest, contra um banco Postgres real (nada de banco em memória nem mocks de repositório).

## Documentação

- `CONTEXT.md` — glossário do domínio.
- `docs/adr/` — decisões de arquitetura.
