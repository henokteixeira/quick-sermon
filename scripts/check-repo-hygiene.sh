#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

status=0

report() {
  local name="$1"
  local reason="$2"
  if [ -z "$reason" ]; then
    echo "$name: ok"
  else
    echo "$name: FAIL $reason"
    status=1
  fi
}

untracked_paths=(
  ".claude|.claude sem arquivos rastreados"
  "frontend/redesing|frontend/redesing não existe no índice"
  "backend/app/modules/content|backend/app/modules/content não existe no índice"
  "docs/handoffs|docs/handoffs não existe no índice"
)

for entry in "${untracked_paths[@]}"; do
  path="${entry%%|*}"
  name="${entry#*|}"
  if [ -n "$(git ls-files "$path")" ]; then
    report "$name" "ainda tem arquivos rastreados"
  else
    report "$name" ""
  fi
done

if git grep -l "KAI-" -- docs README.md CLAUDE.md > /dev/null 2>&1; then
  report "nenhuma referência a KAI-" "referência encontrada em docs, README.md ou CLAUDE.md"
else
  report "nenhuma referência a KAI-" ""
fi

if git check-ignore -q .claude; then
  report ".claude/ ignorado pelo git" ""
else
  report ".claude/ ignorado pelo git" ".claude não está no .gitignore"
fi

readme="docs/design/README.md"
if [ ! -f "$readme" ]; then
  report "docs/design/README.md dentro do limite" "$readme não existe"
else
  lines=$(wc -l < "$readme" | tr -d ' ')
  if [ "$lines" -gt 20 ]; then
    report "docs/design/README.md dentro do limite" "tem mais de 20 linhas ($lines)"
  elif grep -qi "agent" "$readme"; then
    report "docs/design/README.md dentro do limite" "contém a palavra 'agent'"
  else
    report "docs/design/README.md dentro do limite" ""
  fi
fi

exit "$status"
