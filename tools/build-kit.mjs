#!/usr/bin/env node
// any kit → web/local/scenario-<name>.json (+ -1, -2 by level). For kits that stay on this computer: web/local/ is not in git and not on the site.
//   node tools/build-kit.mjs <kit dir> <name>
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTimeline } from './timeline.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [kitArg, name] = process.argv.slice(2);
if (!kitArg || !name) { console.error('usage: build-kit.mjs <kit dir> <name>'); process.exit(2); }
const kit = path.resolve(kitArg.replace(/^~/, os.homedir()));
const manifest = JSON.parse(fs.readFileSync(path.join(kit, 'manifest.json'), 'utf8'));
const out = path.join(root, 'web', 'local'); fs.mkdirSync(out, { recursive: true });
for (const level of [1, 2, 3]) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-'));
  for (const d of ['files', 'versions']) fs.symlinkSync(path.join(kit, d), path.join(tmp, d));
  fs.copyFileSync(path.join(kit, 'answers.json'), path.join(tmp, 'answers.json'));
  fs.writeFileSync(path.join(tmp, 'manifest.json'), JSON.stringify({ ...manifest, phases: manifest.phases.filter((p) => (p.level || 1) <= level) }));
  const tl = buildTimeline(tmp); fs.rmSync(tmp, { recursive: true, force: true });
  let n = 0x51a7; for (const e of tl.events) if (e.type === 'commit') e.hash = (n = (n * 7919 + 104729) % 0xfffffff).toString(16).padStart(7, '0').slice(0, 7);
  const f = level === 3 ? `scenario-${name}.json` : `scenario-${name}-${level}.json`;
  fs.writeFileSync(path.join(out, f), JSON.stringify(tl));
  console.log(`уровень ${level} → web/local/${f} · ${tl.phases.length} фаз · ${(tl.duration / 1000).toFixed(0)} с`);
}
