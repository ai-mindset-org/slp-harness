#!/usr/bin/env bash
# проверка папки перед тем, как делиться: всё ли в git и нет ли приватных данных
# запуск из папки: bash checks/check-git-private.sh   ·   код выхода 0 – чисто, 1 – есть что поправить
set -u
cd "${1:-.}" || exit 2
bad=0
say() { printf '%s\n' "$*"; }
say "== git"
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then say "✗ это не git-репозиторий: git init"; exit 1; fi
dirty=$(git status --porcelain)
if [ -n "$dirty" ]; then say "✗ не закоммичено:"; printf '%s\n' "$dirty" | head -20; bad=1; else say "✓ всё закоммичено"; fi
remote=$(git remote -v | awk 'NR==1{print $2}')
if [ -f .local-only ]; then
  if [ -n "$remote" ]; then say "✗ папка помечена .local-only, а удалённый репозиторий есть: $remote"; bad=1; else say "✓ только на этом компьютере, удалённого репозитория нет"; fi
else
  say "remote: ${remote:-нет}"
fi
say "== приватные данные в файлах git"
files=$(git ls-files | grep -v '^checks/check-git-private.sh$')
scan() { [ -z "$files" ] && return; printf '%s\n' "$files" | tr '\n' '\0' | xargs -0 grep -nIE "$1" 2>/dev/null | cut -c1-160 | head -8; }
hit() { out=$(scan "$2"); if [ -n "$out" ]; then say "✗ $1:"; printf '%s\n' "$out"; bad=1; else say "✓ $1: нет"; fi; }
hit "телефоны" '(\+7|\b8)[ -]?\(?9[0-9]{2}\)?[ -]?[0-9]{3}[ -]?[0-9]{2}[ -]?[0-9]{2}'
hit "почты" '[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}'
hit "ключи и токены" '(sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|xox[bp]-[A-Za-z0-9-]{10,}|BEGIN [A-Z ]*PRIVATE KEY)'
hit "номера карт" '\b[0-9]{4}[ -][0-9]{4}[ -][0-9]{4}[ -][0-9]{4}\b'
if [ -f .private-words ]; then
  out=$(printf '%s\n' "$files" | grep -v '^.private-words$' | tr '\n' '\0' | xargs -0 grep -nIFf .private-words 2>/dev/null | cut -c1-160 | head -8)
  if [ -n "$out" ]; then say "✗ слова из .private-words:"; printf '%s\n' "$out"; bad=1; else say "✓ слова из .private-words: нет"; fi
fi
say "== итог"
if [ $bad -ne 0 ]; then say "✗ сначала поправить то, что выше"; elif [ -f .local-only ]; then say "✓ чисто, папка остаётся только на этом компьютере"; else say "✓ папкой можно делиться"; fi
exit $bad
