#!/usr/bin/env node
// kit/ → web/scenario.json: one line of phases, anyone stops where it is enough.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTimeline } from './timeline.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tl = buildTimeline(path.join(root, 'kit'));
let n = 0x51a7;
for (const e of tl.events) if (e.type === 'commit') e.hash = (n = (n * 7919 + 104729) % 0xfffffff).toString(16).padStart(7, '0').slice(0, 7);
tl.generated = new Date().toISOString();
fs.writeFileSync(path.join(root, 'web', 'scenario.json'), JSON.stringify(tl));
for (const old of ['scenario-1.json', 'scenario-2.json']) fs.rmSync(path.join(root, 'web', old), { force: true });
const files = new Set();
for (const e of tl.events) { if (e.type === 'file') files.add(e.path); if (e.type === 'rename') { files.delete(e.from); files.add(e.to); } }
console.log(`web/scenario.json · ${tl.phases.length} фаз · ${files.size} файлов · ${(tl.duration / 1000).toFixed(0)} с`);
fs.writeFileSync(path.join(root, 'web', 'kit-docs.json'), JSON.stringify({ generated: new Date().toISOString(), docs: {} }));
await import('./export-tools.mjs');
