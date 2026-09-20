#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

status=0

report() {
  local name="$1"
  local reason="$2"
  if [ -z "$reason" ]; then
    echo "$name ok"
  else
    echo "$name FAIL $reason"
    status=1
  fi
}

if [ -n "$(git ls-files .claude)" ]; then
  report "A1" ".claude ainda tem arquivos rastreados"
else
  report "A1" ""
fi

if [ -n "$(git ls-files frontend/redesing)" ]; then
  report "A2" "frontend/redesing ainda está no índice"
else
  report "A2" ""
fi

if [ -n "$(git ls-files backend/app/modules/content)" ]; then
  report "A3" "backend/app/modules/content ainda está no índice"
else
  report "A3" ""
fi

if [ -n "$(git ls-files docs/handoffs)" ]; then
  report "A4" "docs/handoffs ainda está no índice"
else
  report "A4" ""
fi

if git grep -l "KAI-" -- docs README.md CLAUDE.md > /dev/null 2>&1; then
  report "A5" "referência a KAI- encontrada em docs, README.md ou CLAUDE.md"
else
  report "A5" ""
fi

if grep -qx '\.claude/' .gitignore 2>/dev/null; then
  report "A6" ""
else
  report "A6" ".claude/ não está no .gitignore"
fi

readme="docs/design/README.md"
if [ ! -f "$readme" ]; then
  report "A7" "$readme não existe"
else
  lines=$(wc -l < "$readme" | tr -d ' ')
  if [ "$lines" -gt 20 ]; then
    report "A7" "$readme tem mais de 20 linhas ($lines)"
  elif grep -qi "agent" "$readme"; then
    report "A7" "$readme contém a palavra 'agent'"
  else
    report "A7" ""
  fi
fi

exit "$status"
