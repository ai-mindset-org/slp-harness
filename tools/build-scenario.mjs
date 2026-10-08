#!/usr/bin/env node
// kit/ → web/scenario.json (full) + web/scenario-1.json, scenario-2.json (levels).
// SLP fork: no render/check steps, phases carry `level` 1–3.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTimeline } from './timeline.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const kit = path.join(root, 'kit');
const manifest = JSON.parse(fs.readFileSync(path.join(kit, 'manifest.json'), 'utf8'));

function build(level) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'slp-kit-'));
  for (const d of ['files', 'versions']) fs.symlinkSync(path.join(kit, d), path.join(tmp, d));
  fs.copyFileSync(path.join(kit, 'answers.json'), path.join(tmp, 'answers.json'));
  const phases = manifest.phases.filter((p) => (p.level || 1) <= level);
  fs.writeFileSync(path.join(tmp, 'manifest.json'), JSON.stringify({ ...manifest, phases }));
  const tl = buildTimeline(tmp);
  fs.rmSync(tmp, { recursive: true, force: true });
  let n = 0x51a7;
  for (const e of tl.events) if (e.type === 'commit') e.hash = (n = (n * 7919 + 104729) % 0xfffffff).toString(16).padStart(7, '0').slice(0, 7);
  tl.level = level;
  tl.generated = new Date().toISOString();
  return tl;
}

for (const level of [1, 2, 3]) {
  const tl = build(level);
  const name = level === 3 ? 'scenario.json' : `scenario-${level}.json`;
  fs.writeFileSync(path.join(root, 'web', name), JSON.stringify(tl));
  const files = new Set();
  for (const e of tl.events) { if (e.type === 'file') files.add(e.path); if (e.type === 'rename') { files.delete(e.from); files.add(e.to); } }
  console.log(`уровень ${level} → web/${name} · ${tl.phases.length} фаз · ${files.size} файлов · ${(tl.duration / 1000).toFixed(0)} с`);
}
fs.writeFileSync(path.join(root, 'web', 'kit-docs.json'), JSON.stringify({ generated: new Date().toISOString(), docs: {} }));
await import('./export-tools.mjs');
