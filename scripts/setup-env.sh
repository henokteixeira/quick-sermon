#!/usr/bin/env bash
set -euo pipefail

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
destino="$raiz/.env"
exemplo="$raiz/.env.example"

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl não encontrado. Instale-o e rode 'make setup' de novo." >&2
  exit 1
fi

if [ -f "$destino" ]; then
  echo "O .env já existe; nada foi alterado."
  exit 0
fi

definir() {
  local temporario
  temporario="$(mktemp)"
  VARIAVEL="$1" VALOR="$2" awk '
    index($0, ENVIRON["VARIAVEL"] "=") == 1 { print ENVIRON["VARIAVEL"] "=" ENVIRON["VALOR"]; next }
    { print }
  ' "$destino" >"$temporario"
  mv "$temporario" "$destino"
}

cp "$exemplo" "$destino"
chmod 600 "$destino"

senha_admin="$(openssl rand -hex 12)"
definir SECRET_KEY "$(openssl rand -hex 32)"
definir YOUTUBE_OAUTH_ENCRYPTION_KEY "$(openssl rand -base64 32 | tr '+/' '-_')"
definir SEED_ADMIN_PASSWORD "$senha_admin"

email_admin="$(sed -n 's/^SEED_ADMIN_EMAIL=//p' "$destino")"

echo
echo ".env criado com chaves aleatórias."
echo "Admin: $email_admin"
echo "Senha: $senha_admin"
echo "Estão em SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD no .env; esta é a única vez que aparecem aqui."
