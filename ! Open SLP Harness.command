#!/bin/bash
# Double click: the bath complex folder in ~/harness and its live graph.
# No folder yet → build it from the kit (a commit per phase); folder exists → just open the graph.
set -euo pipefail
repo="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
dir="${SLP_HARNESS_DIR:-$HOME/harness/lunnaya-kamenka}"
command -v node >/dev/null || { echo "нужен Node.js 18+: brew install node"; read -r -p "Enter – закрыть"; exit 1; }
if [ ! -d "$dir" ]; then
  exec "$repo/bin/new.sh" "$dir"
else
  exec "$repo/bin/open.sh" "$dir"
fi
