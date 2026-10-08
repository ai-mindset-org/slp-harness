#!/usr/bin/env bash
# Deploy the template into a new folder instantly and open it live.
#   bin/new.sh ~/harness/my-company · кит банного комплекса «Лунная каменка»; свои ответы: --answers my.json
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="${1:?укажи новую папку}"
PRESET="${2:-}"
node "$ROOT/tools/build-scenario.mjs" >/dev/null
node "$ROOT/tools/harness-demo.mjs" --dir "$DIR" --pace 0 ${PRESET:+--preset "$PRESET"}
# pictures of the sections and previews of competitors: GitHub and Obsidian show them, the graph skips binaries
[[ -d "$ROOT/kit/files/_assets" ]] && cp -R "$ROOT/kit/files/_assets" "$DIR/" && git -C "$DIR" add _assets && git -C "$DIR" commit -qm "assets: метафоры разделов и превью конкурентов" || true
exec "$ROOT/bin/open.sh" "$DIR"
