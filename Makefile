.PHONY: up down build migrate migration test-backend seed logs setup test-setup smoke lint help check-hygiene

up:
	docker compose up -d

up-dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

down:
	docker compose down

build:
	docker compose build

migrate:
	docker compose exec backend alembic upgrade head

migration:
	docker compose exec backend alembic revision --autogenerate -m "$(msg)"

test-backend:
	docker compose exec backend pytest -v

seed:
	docker compose exec backend python seed.py

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend worker

setup:
	./scripts/setup-env.sh

test-setup:
	./scripts/test-setup-env.sh

smoke:
	./scripts/smoke.sh

lint:
	docker compose run --rm --no-deps --entrypoint ruff backend check .
	cd frontend && npm run lint

help:
	@echo "up            sobe o stack em segundo plano"
	@echo "up-dev        sobe o stack com --reload e volumes de código"
	@echo "down          derruba o stack"
	@echo "build         builda as imagens"
	@echo "migrate       roda as migrations do backend à mão"
	@echo "migration     cria uma migration nova (msg=\"...\")"
	@echo "test-backend  roda os testes do backend"
	@echo "seed          roda o seed do Admin à mão"
	@echo "logs          segue os logs de todos os serviços"
	@echo "logs-backend  segue os logs de backend e worker"
	@echo "setup         cria o .env a partir do .env.example"
	@echo "test-setup    testa o script de setup do .env"
	@echo "smoke         sobe um clone limpo e prova a subida com dois comandos"
	@echo "lint          roda ruff no backend e eslint no frontend"
	@echo "help          lista os alvos deste Makefile"
	@echo "check-hygiene verifica a higiene do repositório"

check-hygiene:
	bash scripts/check-repo-hygiene.sh
