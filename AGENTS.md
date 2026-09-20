# Quick Sermon

Plataforma web que automatiza o Pipeline de um Clip, da URL da Live ao Clip Publicado no YouTube.

## Rodando comandos

No desenvolvimento local, backend e seus testes rodam **dentro do Docker**: use os alvos do `Makefile` (ex.: `make test-backend`), não `python`/`pytest` diretamente no host. No CI, os mesmos testes rodam com `pip`/`pytest` direto no runner do GitHub Actions, contra um Postgres de serviço — não em container Docker.

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
