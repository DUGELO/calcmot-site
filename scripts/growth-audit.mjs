#!/usr/bin/env node
// Growth outreach: local audit, no external accounts, messages or submissions.
import fs from 'node:fs';
import path from 'node:path';
const source=path.resolve('docs/growth/prospects.json');
const data=JSON.parse(fs.readFileSync(source,'utf8'));
const allowed=new Set(['not_sent','submitted','rejected','published','unavailable']);
let errors=[];
const ids=new Set(),urls=new Set();
for(const t of data.targets) {
  if(!t.id||ids.has(t.id)) errors.push('duplicate or empty id: '+t.id); ids.add(t.id);
  let u;
  try {u=new URL(t.submitUrl); if(u.protocol!=='https:') throw Error('requires https');}
  catch {errors.push('invalid URL: '+t.id); continue;}
  if(urls.has(u.href)) errors.push('duplicate URL: '+t.id);
  urls.add(u.href);
  if(!allowed.has(t.submissionStatus)) errors.push('invalid status: '+t.id);
  if(t.submissionStatus==='published'&&!t.publishedUrl) errors.push('published without evidence: '+t.id);
  if(t.publishedUrl) {try {const p=new URL(t.publishedUrl);if(p.protocol!=='https:')throw Error();}catch {errors.push('invalid published URL: '+t.id);}}
}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
const counts=Object.fromEntries([...allowed].map(s=>[s,data.targets.filter(t=>t.submissionStatus===s).length]));
const priority=data.targets.filter(t=>t.priority==='A'&&t.submissionStatus==='not_sent');
const lines=['# CalcMot — Backlink Outreach','',`Gerado em: ${new Date().toISOString()}`,'','## Status','',`- Oportunidades: ${data.targets.length}`,...Object.entries(counts).map(([k,v])=>`- ${k}: ${v}`),'','## Próximas ações (prioridade A)','',...priority.map(t=>`- **${t.name}** — ${t.submitUrl} — ${t.notes}`),'','## Links publicados (declarados)','',...(data.targets.filter(t=>t.submissionStatus==='published').map(t=>`- ${t.name}: ${t.publishedUrl}`)||[]),'','Nota: marcação manual de publicado não comprova backlink vivo, indexado ou seguido; confirme e registre evidência. Não há envios automáticos.',''];
const output=path.resolve(process.argv[2]||'growth-outreach-report.md');
fs.writeFileSync(output,lines.join('\n'));console.log('Relatório em '+output);
