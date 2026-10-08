import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {walk} from './folder-state.mjs';
test('local server: origin, write token, symlinks and HTML isolation',async()=>{
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'harness-security-')),dir=path.join(base,'folder');fs.mkdirSync(dir);
 fs.writeFileSync(path.join(base,'private.md'),'OUTSIDE_SECRET');fs.writeFileSync(path.join(dir,'sample.md'),'# Original');fs.writeFileSync(path.join(dir,'sample.html'),'<h1>Preview</h1>');fs.symlinkSync(path.join(base,'private.md'),path.join(dir,'alias.md'));
 execFileSync('git',['init','-q',dir]);execFileSync('git',['-C',dir,'config','user.name','Harness QA']);execFileSync('git',['-C',dir,'config','user.email','qa@example.invalid']);
 const probe=net.createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(r=>probe.close(r));
 const proc=spawn(process.execPath,['tools/harness-server.mjs','--dir',dir,'--port',String(port)],{env:{PATH:process.env.PATH,HOME:base},stdio:['ignore','pipe','pipe']});
 try{
  await Promise.race([once(proc.stdout,'data'),new Promise((_,r)=>setTimeout(()=>r(Error('startup timeout')),4000).unref())]);
  const url=`http://127.0.0.1:${port}`;
  assert.equal((await fetch(url+'/api/session',{headers:{Origin:'https://example.com'}})).status,403);
  const session=await (await fetch(url+'/api/session')).json();assert.equal(session.serverHost,'');
  const state=await (await fetch(url+'/api/state')).json();assert.ok(!JSON.stringify(state).includes('OUTSIDE_SECRET'));assert.ok(!walk(dir).some(x=>x.path==='alias.md'));
  assert.equal((await fetch(url+'/f/alias.md')).status,404);
  assert.equal((await fetch(url+'/api/file',{method:'POST',body:'{}'})).status,403);
  const headers={'content-type':'application/json','x-harness-token':session.token};
  let r=await (await fetch(url+'/api/file',{method:'POST',headers,body:JSON.stringify({path:'sample.md',content:'# Edited'})})).json();assert.equal(r.ok,true);assert.equal(fs.readFileSync(path.join(dir,'sample.md'),'utf8'),'# Edited');
  r=await (await fetch(url+'/api/file',{method:'POST',headers,body:JSON.stringify({path:'alias.md',content:'bad'})})).json();assert.ok(r.error);assert.equal(fs.readFileSync(path.join(base,'private.md'),'utf8'),'OUTSIDE_SECRET');
  const html=await fetch(url+'/f/sample.html');assert.match(html.headers.get('content-security-policy'),/sandbox allow-scripts/);assert.match(html.headers.get('content-security-policy'),/connect-src 'none'/);
  assert.equal((await fetch(url+'/%broken')).status,400);assert.equal((await fetch(url+'/api/session')).status,200);
 }finally{proc.kill('SIGTERM');await once(proc,'exit');fs.rmSync(base,{recursive:true,force:true});}
});
