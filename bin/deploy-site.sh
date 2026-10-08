#!/usr/bin/env bash
# deploy-site.sh – publish the guide, About and Demo: open copy (marketing-harness.lab.aimindset.org)
# Public allowlisted export only; internal Team deployment has a separate owner.
# usage: bin/deploy-site.sh [path to a lab-sites clone, default ~/repos/lab-sites]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LAB="${1:-$HOME/repos/lab-sites}"
[[ -e "$LAB/.git" ]] || { echo "нет клона lab-sites: gh repo clone ai-mindset-org/lab-sites $LAB"; exit 1; }
command -v gitleaks >/dev/null || { echo "нужен gitleaks: brew install gitleaks"; exit 1; }
cd "$ROOT"
[[ -z "$(git status --porcelain)" ]] || { echo "в движке незакоммиченные правки – сначала commit и push"; exit 1; }
git pull -q --rebase
node tools/build-scenario.mjs
node tools/build-public.mjs
git -C "$LAB" pull -q --rebase
D=sites/marketing-harness
[[ -d "$LAB/$D" ]] || { echo "ожидается существующий сайт $D"; exit 1; }
# .public is a generated allowlisted export. Never deploy web/team or Git history.
rsync -a --delete "$ROOT/.public/" "$LAB/$D/"
bash "$LAB/scripts/site-preflight.sh" "$LAB" marketing-harness
gitleaks detect --no-git --source "$LAB/$D" --redact --no-banner --log-level error

cd "$LAB"
git add sites/marketing-harness
git diff --cached --quiet -- sites/marketing-harness && { echo "сайт уже совпадает с движком $(git -C "$ROOT" rev-parse --short HEAD)"; exit 0; }
git commit -q -m "marketing-harness: public export $(git -C "$ROOT" rev-parse --short HEAD)" -- sites/marketing-harness
git push -q
echo "выкачено: https://marketing-harness.lab.aimindset.org/ – через минуту"
