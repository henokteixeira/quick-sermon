#!/usr/bin/env bash
set -euo pipefail

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
temporario="$(mktemp -d)"
trap 'rm -rf "$temporario"' EXIT

falhar() {
  echo "FALHOU: $1" >&2
  exit 1
}

mkdir -p "$temporario/scripts"
cp "$raiz/.env.example" "$raiz/Makefile" "$raiz/docker-compose.yml" "$temporario/"
cp "$raiz/scripts/setup-env.sh" "$temporario/scripts/"

cd "$temporario"
make setup >/dev/null || falhar "make setup saiu com erro"

[ -f .env ] || falhar "make setup não criou o .env"

valor_de() {
  sed -n "s/^$1=//p" "$2"
}

for variavel in SECRET_KEY YOUTUBE_OAUTH_ENCRYPTION_KEY SEED_ADMIN_PASSWORD; do
  gerado="$(valor_de "$variavel" .env)"
  exemplo="$(valor_de "$variavel" .env.example)"
  [ -n "$gerado" ] || falhar "$variavel ficou vazia no .env gerado"
  [ "$gerado" != "$exemplo" ] || falhar "$variavel repete o valor do .env.example"
done

chave_fernet="$(valor_de YOUTUBE_OAUTH_ENCRYPTION_KEY .env)"
[ "${#chave_fernet}" -eq 44 ] || falhar "YOUTUBE_OAUTH_ENCRYPTION_KEY tem ${#chave_fernet} caracteres, esperado 44"

configuracao="$(docker compose config)" || falhar "docker compose config saiu com erro"

if grep -q "change-me-in-production" <<<"$configuracao"; then
  falhar "docker compose config ainda expõe change-me-in-production"
fi

segredo="$(valor_de SECRET_KEY .env)"
ocorrencias="$(grep -c -- "$segredo" <<<"$configuracao" || true)"
[ "$ocorrencias" -ge 2 ] || falhar "a SECRET_KEY gerada aparece $ocorrencias vez(es) no compose, esperado backend e worker"

antes="$(shasum .env | cut -d' ' -f1)"
make setup >/dev/null || falhar "segundo make setup saiu com erro"
depois="$(shasum .env | cut -d' ' -f1)"
[ "$antes" = "$depois" ] || falhar "o segundo make setup alterou o .env existente"

echo "test-setup-env: todas as asserções passaram"
