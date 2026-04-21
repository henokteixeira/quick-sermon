.PHONY: up down build migrate migration test-backend test-frontend seed logs

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

test-frontend:
	cd frontend && npm test

seed:
	docker compose exec backend python seed.py

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend worker
