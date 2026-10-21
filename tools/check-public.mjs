import {readdir,readFile,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url));
const ignored=new Set(['node_modules','dist','test-results','playwright-report','.local']);
const manifest=JSON.parse(await readFile(path.join(root,'docs/source-manifest.json'),'utf8'));
const allow=new Set([...manifest.originalFiles.map(f=>f.path),...manifest.addedFiles]);
const found=[];
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const full=path.join(dir,e.name);const rel=path.relative(root,full).split(path.sep).join('/');assert.ok(!(await lstat(full)).isSymbolicLink(),rel+': symlink');if(rel==='.git'){assert.ok(e.isDirectory(),'Unexpected root Git file');continue;}assert.notEqual(e.name,'.git',rel+': nested Git history');if(e.isDirectory()){if(!ignored.has(e.name))await walk(full);}else found.push(rel);}}
await walk(root);assert.deepEqual(new Set(found),allow,'Unexpected or missing portfolio file');
let links=0,images=0;
const patterns=[[/AIza[0-9A-Za-z_-]{30,}/,'provider key'],[/sk-(?:proj-)?[A-Za-z0-9_-]{25,}/,'provider key'],[/(?:AKIA|ASIA)[A-Z0-9]{16}/,'cloud credential'],[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,'private key'],[/gh[pousr]_[A-Za-z0-9]{20,}/,'GitHub token'],[/eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}/,'JWT'],[/[A-Z]:\\Users\\|\/(?:home|srv|var\/www)\/[\w.-]+\//,'private path'],[/https?:\/\/[^/\s:@]+:[^/\s@]+@/,'URL credential'],[/\b0\d{1,2}[- ]\d{3,4}[- ]\d{4}\b/,'phone']];
const allowedImages=new Set(['screenshots/01-dashboard.png','screenshots/02-calendar.png','screenshots/03-booking.png','screenshots/04-materials.png']);
for(const rel of found){assert.ok(!/(^|\/)\.env|\.sqlite|\.db$|\.pdf$|\.hwp$|\.pem$|\.key$/i.test(rel),rel+': excluded file');const bytes=await readFile(path.join(root,rel));if(allowedImages.has(rel)){assert.ok(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),rel+': PNG');images++;continue;}const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);for(const [pattern,label]of patterns)assert.ok(!pattern.test(text),rel+': '+label);for(const email of text.match(/[A-Za-z0-9_.+-]+@[A-Za-z0-9_.-]+\.[A-Za-z]{2,}/g)||[])assert.ok(email.endsWith('@example.invalid'),rel+': unreviewed email');
if(rel.endsWith('.md')){assert.equal((text.match(/\x60{3}/g)||[]).length%2,0,rel+': code fence');for(const m of text.matchAll(/\]\(([^)]+)\)/g)){const target=m[1].split('#')[0];if(!target||/^https?:\/\//.test(target))continue;const resolved=path.resolve(path.dirname(path.join(root,rel)),target);assert.ok(!path.relative(root,resolved).startsWith('..'),rel+': outside link');await lstat(resolved);links++;}}}
for(const f of manifest.originalFiles){const hash=createHash('sha256').update(await readFile(path.join(root,f.path))).digest('hex');assert.equal(hash,f.portfolioSha256,f.path+': content differs from manifest');if(f.mode==='unchanged')assert.equal(hash,f.sourceSha256);}
const app=await readFile(path.join(root,'src/App.tsx'),'utf8');assert.ok(!/localStorage\.(?:getItem|setItem)\(['"]arko_/.test(app),'legacy storage access');
for(const rel of ['server.ts','portfolio-api.ts'])assert.ok(!/GoogleGenAI|generateContent|dotenv\.config|GEMINI_API_KEY/.test(await readFile(path.join(root,rel),'utf8')),rel+': live provider access');
assert.equal(images,4);
console.log('PASS: '+found.length+' reviewed files; '+images+' PNG screenshots; '+links+' local Markdown links');
console.log('PASS: '+manifest.originalFiles.filter(f=>f.mode==='unchanged').length+' byte-identical original files; '+manifest.originalFiles.filter(f=>f.mode==='modified').length+' reviewed modified originals');
console.log('PASS: reviewed payload excludes environment/DB/Git metadata/documents; secret/contact/path patterns; legacy keys excluded; no live AI client');
console.log('Local-only directories excluded: '+[...ignored].join(', '));
