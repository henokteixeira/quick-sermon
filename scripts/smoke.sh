#!/usr/bin/env bash
set -uo pipefail

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$raiz"

falhar() {
  echo "smoke: FALHA: $1" >&2
  exit 1
}

subiu=""
limpar() {
  if [ -n "$subiu" ]; then
    docker compose down >/dev/null 2>&1
  fi
}
trap limpar EXIT

echo "smoke: verificando portas publicadas"
portas="$(docker compose config 2>/dev/null | awk '/published:/ {gsub(/[^0-9]/, "", $2); print $2}' | sort -un)"
for porta in $portas; do
  if command -v lsof >/dev/null 2>&1 && lsof -i ":$porta" -sTCP:LISTEN >/dev/null 2>&1; then
    falhar "porta $porta já está em uso; libere-a e rode 'make smoke' de novo"
  fi
done

echo "smoke: make setup"
make setup >/dev/null || falhar "make setup falhou"

echo "smoke: make up"
subiu=1
make up || falhar "make up falhou"

echo "smoke: esperando /health responder status ok (até 180s)"
corpo=""
saudavel=""
for _ in $(seq 1 180); do
  corpo="$(curl -fsS http://localhost/health 2>/dev/null || true)"
  if [ -n "$corpo" ] && printf '%s' "$corpo" | grep -q '"status"[[:space:]]*:[[:space:]]*"ok"'; then
    saudavel=1
    break
  fi
  sleep 1
done
[ -n "$saudavel" ] || falhar "/health não respondeu status ok em 180s (último corpo: ${corpo:-<vazio>})"

echo "smoke: login do Admin gerado por make setup"
email_admin="$(sed -n 's/^SEED_ADMIN_EMAIL=//p' .env)"
senha_admin="$(sed -n 's/^SEED_ADMIN_PASSWORD=//p' .env)"
resposta_login="$(curl -sS -X POST http://localhost/api/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$email_admin\",\"password\":\"$senha_admin\"}" 2>/dev/null || true)"
printf '%s' "$resposta_login" | grep -q '"access_token"' || falhar "login do Admin falhou (resposta: ${resposta_login:0:400})"

echo "smoke: verificando estado de backend e worker"
estado_backend="$(docker compose ps backend --format '{{.State}}' 2>/dev/null || true)"
[ "$estado_backend" = "running" ] || falhar "backend não está running (estado: ${estado_backend:-<ausente>})"

estado_worker="$(docker compose ps worker --format '{{.State}}' 2>/dev/null || true)"
[ "$estado_worker" = "running" ] || falhar "worker não está running (estado: ${estado_worker:-<ausente>})"

docker compose logs worker 2>/dev/null | grep -qi temporal || falhar "log do worker não menciona conexão com o Temporal"

echo "smoke: verificando ausência de bind mount de arquivo para os Cookies"
if docker compose config 2>/dev/null | grep -q 'youtube-cookies\.txt:/secrets/youtube-cookies\.txt'; then
  falhar "docker compose config ainda contém bind mount de arquivo para os Cookies do YouTube"
fi

echo "smoke: tudo verde"
