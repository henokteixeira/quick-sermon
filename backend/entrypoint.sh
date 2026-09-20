#!/bin/sh
set -e

alembic upgrade head

if ! python seed.py; then
  echo "" >&2
  echo "entrypoint: seed falhou (mensagem acima). Se for sobre SEED_ADMIN_PASSWORD vazia, rode 'make setup' para gerar um .env com uma senha aleatória e tente de novo." >&2
  exit 1
fi

exec "$@"
