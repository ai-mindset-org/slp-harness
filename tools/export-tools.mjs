#!/usr/bin/env node
// kit/files/dashboards/*.html → web/tools/<latin>.html, rendered with kit/answers.json: the tools open on their own.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderTemplate } from './timeline.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const answers = JSON.parse(fs.readFileSync(path.join(root, 'kit', 'answers.json'), 'utf8'));
const NAMES = { 'карта конкурентов': 'karta', 'прайсинг': 'praising', 'граф гостей': 'gosti', 'загрузка': 'zagruzka' };
const out = path.join(root, 'web', 'tools');
fs.mkdirSync(out, { recursive: true });
for (const [ru, slug] of Object.entries(NAMES)) {
  const src = path.join(root, 'kit', 'files', 'dashboards', `{dashboard} ${ru}.html`);
  if (fs.existsSync(src)) fs.writeFileSync(path.join(out, `${slug}.html`), renderTemplate(fs.readFileSync(src, 'utf8'), answers));
}
console.log('tools →', fs.readdirSync(out).join(' '));
