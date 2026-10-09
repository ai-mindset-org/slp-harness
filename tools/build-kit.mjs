#!/usr/bin/env node
// any kit → web/local/scenario-<name>.json. For kits that stay on this computer: web/local/ is not in git and not on the site.
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
const out = path.join(root, 'web', 'local'); fs.mkdirSync(out, { recursive: true });
const tl = buildTimeline(kit);
let n = 0x51a7; for (const e of tl.events) if (e.type === 'commit') e.hash = (n = (n * 7919 + 104729) % 0xfffffff).toString(16).padStart(7, '0').slice(0, 7);
fs.writeFileSync(path.join(out, `scenario-${name}.json`), JSON.stringify(tl));
for (const lv of [1, 2]) fs.rmSync(path.join(out, `scenario-${name}-${lv}.json`), { force: true });
console.log(`web/local/scenario-${name}.json · ${tl.phases.length} фаз · ${(tl.duration / 1000).toFixed(0)} с`);
