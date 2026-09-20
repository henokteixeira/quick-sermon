#!/usr/bin/env bash
set -euo pipefail

root=$(git rev-parse --show-toplevel)
cd "$root"

readme="$root/README.md"
falhar() {
  echo "check-readme: $1" >&2
  exit 1
}

if [ ! -f "$readme" ]; then
  falhar "README.md não encontrado em $root"
fi

# (a) toda porta citada no README existe em `docker compose config`
compose_config=$(docker compose config 2>/dev/null) || falhar "docker compose config falhou"

portas_readme=$(
  {
    grep -oE 'localhost:[0-9]+' "$readme" | cut -d: -f2
    grep -oE '\*\*[0-9, ]+\*\*' "$readme" | grep -oE '[0-9]+'
  } | sort -u
)

while IFS= read -r porta; do
  [ -z "$porta" ] && continue
  if ! echo "$compose_config" | grep -qE "published: \"?$porta\"?"; then
    falhar "porta $porta citada no README não existe em docker compose config"
  fi
done <<< "$portas_readme"

# (b) todo alvo `make` citado no README existe no Makefile
alvos_makefile=$(grep -oE '^[a-zA-Z_-]+:' Makefile | tr -d ':')
while IFS= read -r alvo; do
  if ! echo "$alvos_makefile" | grep -qx "$alvo"; then
    falhar "alvo 'make $alvo' citado no README não existe no Makefile"
  fi
done < <(grep -oE 'make [a-zA-Z_-]+' "$readme" | awk '{print $2}' | sort -u)

# (c) o README não contém a palavra "Ollama"
if grep -qi "ollama" "$readme"; then
  falhar "README ainda cita Ollama"
fi

# (d) as oito seções existem
secoes=(
  "Pré-requisitos"
  "Subindo"
  "Entrando"
  "Primeiro vídeo"
  "Cookies do YouTube"
  "Publicar no YouTube (opcional)"
  "O que não está no MVP"
  "Problemas comuns"
)
for secao in "${secoes[@]}"; do
  if ! grep -qF "$secao" "$readme"; then
    falhar "seção obrigatória ausente: $secao"
  fi
done

echo "check-readme: ok"
