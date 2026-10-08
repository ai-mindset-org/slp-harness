#!/usr/bin/env node
// Explicit public export. Never copy Team state, runtime logs or an entire checkout.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'.public');
fs.mkdirSync(out,{recursive:true});
// Only this generated, fixed path may be replaced.
for(const entry of fs.readdirSync(out)) fs.rmSync(path.join(out,entry),{recursive:true,force:true});
const allowed=['index.html','guide.html','access.html','styles.css','doc.css','app.js','doc.js','scenario.json','kit-docs.json','og-harness-graph.jpg','assets','vendor'];
for(const f of allowed) fs.cpSync(path.join(root,'web',f),path.join(out,f),{recursive:true});
for(const f of ['index.html','guide.html','access.html']) {
 let s=fs.readFileSync(path.join(out,f),'utf8');
 s=s.replace('<head>','<head><meta name="harness-surface" content="public">');
 s=s.replace(/<button[^>]*data-mode="team"[^>]*>[\s\S]*?<\/button>/g,'').replace(/<a[^>]*href="[^"]*mode=team[^"]*"[^>]*>[\s\S]*?<\/a>/g,'');
 s=s.replace(/<div class="cn-opt">\s*<b>03 · Team<\/b>[\s\S]*?<\/div>/,'');
 s=s.replace(/<link[^>]*https:\/\/fonts\.[^>]*>/g,'');
 s=s.replace('</head>',`<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'none'"></head>`);
 fs.writeFileSync(path.join(out,f),s.replace(/^[ \t]+$/gm,''));
}
for(const f of ['app.js','doc.js']) {
 let s=fs.readFileSync(path.join(out,f),'utf8');
 s=s.replaceAll('https://content.aimindset.org/marketing-harness/?mode=team','access.html');
 fs.writeFileSync(path.join(out,f),s);
}
// Public ZIP is a fresh file package, never Git history or team exports.
execFileSync('python3',['-c',String.raw`
from pathlib import Path
import zipfile,sys
root=Path(sys.argv[1]);out=Path(sys.argv[2])
with zipfile.ZipFile(out/'marketing-harness-kit.zip','w',zipfile.ZIP_DEFLATED) as z:
 for folder in ['kit','tools','bin']:
  for p in (root/folder).rglob('*'):
   if not p.is_file() or p.is_symlink() or p.name in ['.DS_Store','publish-team.sh','deploy-site.sh']:continue
   z.write(p,'marketing-harness/'+str(p.relative_to(root)))
 for p in out.rglob('*'):
  if p.is_file() and p.suffix!='.zip':z.write(p,'marketing-harness/web/'+str(p.relative_to(out)))
 z.write(root/'START-HERE.md','marketing-harness/README.md')
 z.write(root/'START-HERE.md','marketing-harness/START-HERE.md')
`,root,out],{stdio:'inherit'});
console.log(`public export: ${out}`);
