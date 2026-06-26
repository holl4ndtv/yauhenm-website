// Render the 8 prepared drafts into ONE self-contained reading-room HTML (brand-styled),
// so Yauhen can read them all before scheduling. Output: READING-ROOM.html in this folder.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from '../../scripts/node_modules/gray-matter/index.js';
import { marked } from '../../scripts/node_modules/marked/lib/marked.esm.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const files = fs.readdirSync(HERE).filter(f => /^0[2-9]-.*\.md$/.test(f)).sort();

const sections = files.map((f, i) => {
  const { data, content } = matter(fs.readFileSync(path.join(HERE, f), 'utf8'));
  const wc = content.split(/\s+/).filter(Boolean).length;
  return `<article id="p${i+1}">
    <div class="tag">Draft ${String(i+1).padStart(2,'0')} · ${data.lane||''} · ~${Math.round(wc/220)} min</div>
    <h1>${data.title||f}</h1>
    <p class="desc">${data.description||''}</p>
    <div class="body">${marked.parse(content)}</div>
  </article>`;
}).join('\n<hr class="between">\n');

const toc = files.map((f,i)=>{
  const { data } = matter(fs.readFileSync(path.join(HERE,f),'utf8'));
  return `<a href="#p${i+1}"><b>${String(i+1).padStart(2,'0')}</b> ${data.title||f}</a>`;
}).join('');

const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reading room — 8 prepared blogs</title>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Fraunces:ital,opsz,wght@0,9..144,400;1,9..144,400&family=Inter:wght@400;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
<style>
:root{--bg:#0E0C0A;--soft:#16130F;--bone:#F2EDE3;--mute:#A89F92;--dim:#6B6258;--gold:#C9A961;--rust:#C7593C;--rule:rgba(242,237,227,.1)}
*{box-sizing:border-box;margin:0;padding:0}body{background:var(--bg);color:var(--bone);font-family:Inter,sans-serif;line-height:1.7}
.flag{background:var(--rust);color:#fff;text-align:center;font-family:'JetBrains Mono';font-size:12px;padding:8px;text-transform:uppercase;letter-spacing:.06em}
.toc{position:sticky;top:0;background:rgba(14,12,10,.95);backdrop-filter:blur(8px);border-bottom:1px solid var(--rule);padding:14px 20px;display:flex;flex-wrap:wrap;gap:6px 16px}
.toc a{color:var(--mute);font-size:12px;text-decoration:none;font-family:'JetBrains Mono'}.toc a:hover{color:var(--gold)}.toc b{color:var(--gold)}
.wrap{max-width:720px;margin:0 auto;padding:40px 24px 100px}
.tag{font-family:'JetBrains Mono';font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin-bottom:16px}
h1{font-family:Anton,sans-serif;text-transform:uppercase;font-size:clamp(28px,5.5vw,46px);line-height:1.04;margin-bottom:14px}
.desc{font-family:Fraunces,serif;font-style:italic;color:var(--mute);font-size:18px;margin-bottom:28px}
.body{font-size:16.5px}
.body h2{font-family:Anton,sans-serif;text-transform:uppercase;font-size:clamp(20px,3.6vw,28px);margin:38px 0 12px}
.body h3{font-family:Fraunces,serif;font-size:19px;color:var(--gold);margin:24px 0 6px}
.body p,.body li{margin-bottom:14px}.body ul,.body ol{padding-left:22px}
.body strong{color:var(--bone)}.body em{font-family:Fraunces,serif;color:var(--mute)}
.body a{color:var(--gold)}.body code{font-family:'JetBrains Mono';font-size:.85em;background:var(--soft);padding:2px 6px;border-radius:4px;color:var(--gold)}
.body pre{background:var(--soft);border:1px solid var(--rule);border-radius:8px;padding:16px;overflow-x:auto;font-family:'JetBrains Mono';font-size:13px;margin-bottom:16px}
.body table{width:100%;border-collapse:collapse;margin:18px 0;font-size:14px}.body th,.body td{border:1px solid var(--rule);padding:9px 12px;text-align:left}.body th{background:var(--soft);color:var(--gold);font-family:'JetBrains Mono';font-size:11px;text-transform:uppercase}
hr.between{border:0;border-top:1px solid var(--rule);margin:60px 0}
</style></head><body>
<div class="flag">⚠ reading room — 8 prepared blogs, all pass the AEO/SEO gate · not live yet</div>
<nav class="toc">${toc}</nav>
<div class="wrap">${sections}</div>
</body></html>`;

fs.writeFileSync(path.join(HERE, 'READING-ROOM.html'), html);
console.log('wrote READING-ROOM.html with', files.length, 'posts');
