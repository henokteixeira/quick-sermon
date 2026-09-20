#!/usr/bin/env bash
set -euo pipefail

root=$(git rev-parse --show-toplevel)
cd "$root"

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

check_untracked() {
  local path="$1"
  local name="$2"
  local output
  if ! output=$(git ls-files "$path" 2>&1); then
    report "$name" "git ls-files falhou: $output"
    return
  fi
  if [ -n "$output" ]; then
    report "$name" "ainda tem arquivos rastreados"
  else
    report "$name" ""
  fi
}

untracked_paths=(
  ".claude|.claude sem arquivos rastreados"
  "frontend/redesing|frontend/redesing não existe no índice"
  "backend/app/modules/content|backend/app/modules/content não existe no índice"
  "docs/handoffs|docs/handoffs não existe no índice"
)

for entry in "${untracked_paths[@]}"; do
  check_untracked "${entry%%|*}" "${entry#*|}"
done

check_no_content_match() {
  local pattern="$1"
  local name="$2"
  local output rc
  if output=$(git grep -l "$pattern" -- docs README.md CLAUDE.md 2>&1); then
    rc=0
  else
    rc=$?
  fi
  if [ "$rc" -eq 0 ]; then
    report "$name" "referência encontrada em: $output"
  elif [ "$rc" -eq 1 ]; then
    report "$name" ""
  else
    report "$name" "git grep falhou (código $rc): $output"
  fi
}

check_no_content_match "KAI-" "nenhuma referência a KAI- no conteúdo"

check_no_filename_match() {
  local pattern="$1"
  local name="$2"
  local all_files matched
  if ! all_files=$(git ls-files 2>&1); then
    report "$name" "git ls-files falhou: $all_files"
    return
  fi
  if matched=$(printf '%s\n' "$all_files" | grep -i "$pattern"); then
    report "$name" "arquivo rastreado com nome suspeito: $matched"
  else
    report "$name" ""
  fi
}

check_no_filename_match "KAI-" "nenhum arquivo rastreado com KAI- no nome"
check_no_filename_match "test_detection_dataset\.py" "test_detection_dataset.py não existe em nenhum arquivo rastreado"

if git check-ignore -q .claude/settings.json; then
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
