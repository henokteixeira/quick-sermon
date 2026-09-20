#!/usr/bin/env bash
set -uo pipefail

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$raiz"

export COMPOSE_PROJECT_NAME="$(basename "$raiz" | tr '[:upper:]' '[:lower:]')-smoke"

falhar() {
  echo "smoke: FALHA: $1" >&2
  exit 1
}

subiu=""
limpar() {
  if [ -n "$subiu" ]; then
    docker compose down -v >/dev/null 2>&1
  fi
}
trap limpar EXIT

echo "smoke: make setup"
make setup >/dev/null || falhar "make setup falhou"

echo "smoke: lendo docker compose config"
config_saida="$(docker compose config 2>&1)"
config_status=$?
[ "$config_status" -eq 0 ] || falhar "docker compose config falhou (status $config_status): $config_saida"

echo "smoke: verificando portas publicadas"
if ! command -v lsof >/dev/null 2>&1; then
  echo "smoke: lsof não encontrado; checagem de portas ocupadas foi pulada" >&2
else
  portas="$(printf '%s\n' "$config_saida" | awk '/published:/ {gsub(/[^0-9]/, "", $2); print $2}' | sort -un)"
  for porta in $portas; do
    if lsof -i ":$porta" -sTCP:LISTEN >/dev/null 2>&1; then
      falhar "porta $porta já está em uso; libere-a e rode 'make smoke' de novo"
    fi
  done
fi

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
[ -n "$email_admin" ] || falhar "SEED_ADMIN_EMAIL não está definido no .env"
[ -n "$senha_admin" ] || falhar "SEED_ADMIN_PASSWORD não está definido no .env"
resposta_login="$(curl -sS -X POST http://localhost/api/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$email_admin\",\"password\":\"$senha_admin\"}" 2>/dev/null || true)"
printf '%s' "$resposta_login" | grep -q '"access_token"' || falhar "login do Admin falhou (resposta: ${resposta_login:0:400})"

verificar_estavel() {
  servico="$1"
  estado="$(docker compose ps "$servico" --format '{{.State}}' 2>/dev/null || true)"
  [ "$estado" = "running" ] || falhar "$servico não está running (estado: ${estado:-<ausente>})"

  nome_container="$(docker compose ps "$servico" --format '{{.Name}}' 2>/dev/null || true)"
  [ -n "$nome_container" ] || falhar "$servico: não consegui achar o nome do container"

  reinicios="$(docker inspect --format='{{.RestartCount}}' "$nome_container" 2>/dev/null || true)"
  [ "$reinicios" = "0" ] || falhar "$servico reiniciou $reinicios vez(es) desde que subiu — não está estável"
}

echo "smoke: verificando estado de backend e worker"
verificar_estavel backend
verificar_estavel worker

docker compose logs worker 2>/dev/null | grep -q 'starting_worker' || falhar "log do worker não mostra starting_worker (esse log só aparece depois que Client.connect ao Temporal tem sucesso)"

echo "smoke: verificando ausência de bind mount de arquivo para os Cookies"
if printf '%s\n' "$config_saida" | grep -q 'target: /secrets/youtube-cookies\.txt'; then
  falhar "docker compose config ainda contém bind mount de arquivo para os Cookies do YouTube"
fi

echo "smoke: tudo verde"
