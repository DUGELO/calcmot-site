/** Mandatory Lighthouse SEO=100 gate. Local artifacts and delivered public URLs use the same audit. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, readdir, mkdir, stat } from 'node:fs/promises';
import { resolve, relative, sep, extname } from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { verifySnapshot, parseArticle } from './editorial/snapshot.mjs';
import { listingPaths } from './blog/content.mjs';
const root=resolve(import.meta.dirname,'..');
const args=process.argv.slice(2), remote=args.find(arg=>arg.startsWith('--origin='))?.slice(9);
const directory=resolve(args.find(arg=>!arg.startsWith('--'))??'dist/calcmot-cloudflare/browser');
const paths=new Set(['/blog/']);
const site='https://calcmot.com.br';
let server,origin;
const safeEnv=Object.fromEntries(Object.entries(process.env).filter(([key])=>!/TOKEN|SECRET|PRIVATE_KEY|PASSWORD/i.test(key)));
function add(path) {
  if(!path.startsWith('/') || path.includes('..') || path.includes('?') || path.includes('#') || /^\/admin(?:\/|$)/.test(path))throw new Error('Rota não pública no inventário SEO.');
  paths.add(path);
}
async function blogFiles(folder) {
  for(const entry of await readdir(folder,{withFileTypes:true})) {
    if(entry.isSymbolicLink())throw new Error('Link simbólico no artefato SEO.');
    const path=resolve(folder,entry.name);
    if(entry.isDirectory())await blogFiles(path);
    else if(entry.name==='index.html')add('/'+relative(directory,folder).split(sep).join('/')+'/');
  }
}
try {
  let sitemap;
  if(remote) {
    const url=new URL(remote);
    assert.equal(url.origin,site,'Auditoria remota restrita ao domínio de produção.');
    origin=url.origin;
    const response=await fetch(origin+'/sitemap.xml',{signal:AbortSignal.timeout(20000)});
    assert.equal(response.status,200,'Sitemap público indisponível.');sitemap=await response.text();
    if(process.env.CALCMOT_CONTENT_ROOT) {
      const snapshot=await verifySnapshot(process.env.CALCMOT_CONTENT_ROOT),posts=[];
      for(const file of snapshot.files.filter(file=>file.path.startsWith('articles/'))) {
        const {data}=parseArticle(await readFile(resolve(process.env.CALCMOT_CONTENT_ROOT,file.path),'utf8'));
        posts.push(data);add('/blog/'+data.slug+'/');
      }
      listingPaths(posts).forEach(path=>add('/'+path+'/'));
    }
  } else {
    sitemap=await readFile(resolve(directory,'sitemap.xml'),'utf8');await blogFiles(resolve(directory,'blog'));
    const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.xml':'application/xml','.txt':'text/plain','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.avif':'image/avif','.ico':'image/x-icon'};
    server=createServer(async(req,res)=>{
      try {
        if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
        const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
        const file=resolve(directory,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
        if(file!==directory && !file.startsWith(directory+sep)){res.writeHead(404).end();return;}
        if(!(await stat(file)).isFile()){res.writeHead(404).end();return;}
        const body=await readFile(file);
        res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream','Cache-Control':'no-store'});
        res.end(req.method==='HEAD'?undefined:body);
      }catch{res.writeHead(404).end();}
    });
    await new Promise((resolveReady,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolveReady);});
    origin='http://127.0.0.1:'+server.address().port;
  }
  const locations=[...sitemap.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)];
  assert.ok(locations.length>0,'Sitemap sem URLs auditáveis.');
  assert.equal(locations.length,(sitemap.match(/<url(?:\s|>)/g)??[]).length,'Inventário SEO incompleto.');
  for(const match of locations) {
    const url=new URL(match[1].replaceAll('&amp;','&'));
    assert.equal(url.origin,site,'Domínio incorreto no sitemap.');assert.equal(url.search,'');assert.equal(url.hash,'');add(url.pathname);
  }
  const urls=[...paths].sort().map(path=>origin+path);
  assert.ok(urls.length>0);
  const reportRoot=resolve(root,'.angular/blog-lighthouse'),runRoot=resolve(reportRoot,Date.now()+'-'+randomUUID());
  await mkdir(runRoot,{recursive:true});
  console.log('Relatórios SEO: '+runRoot);
  // Independent browser processes overlap navigation waits. Every URL still has
  // its own real Lighthouse report and every assertion remains mandatory.
  const shards=Array.from({length:Math.min(3,urls.length)},()=>[]);
  urls.forEach((url,index)=>shards[index%shards.length].push(url));
  const results=await Promise.allSettled(shards.map(async(shard,index)=>{
    const shardRoot=resolve(runRoot,'part-'+(index+1));await mkdir(shardRoot);
    const config={ci:{collect:{url:shard,numberOfRuns:1,settings:{chromeFlags:'--headless --no-sandbox --disable-dev-shm-usage',onlyCategories:['seo'],throttlingMethod:'provided',pauseAfterFcpMs:1000,pauseAfterLoadMs:1000,networkQuietThresholdMs:1000,cpuQuietThresholdMs:1000,maxWaitForLoad:20000,blockedUrlPatterns:['*google-analytics.com/*','*googletagmanager.com/*','*clarity.ms/*','*doubleclick.net/*']}},assert:{assertions:{'categories:seo':['error',{minScore:1,aggregationMethod:'pessimistic'}]}},upload:{target:'filesystem',outputDir:resolve(shardRoot,'reports')}}};
    const configPath=resolve(shardRoot,'lighthouserc.json');await writeFile(configPath,JSON.stringify(config));
    await new Promise((resolveRun,reject)=>{
      const child=spawn(process.execPath,[resolve(root,'node_modules/@lhci/cli/src/cli.js'),'autorun','--config='+configPath],{cwd:shardRoot,env:safeEnv,stdio:'inherit'});
      child.once('error',reject);child.once('close',code=>code===0?resolveRun():reject(new Error('Lighthouse bloqueou a publicação: SEO 100/100 é obrigatório.')));
    });
    return resolve(shardRoot,'.lighthouseci');
  }));
  const failed=results.find(result=>result.status==='rejected');
  if(failed)throw failed.reason;
  const reports=[];
  for(const result of results){
    const folder=result.value;
    for(const file of await readdir(folder))if(file.startsWith('lhr-')&&file.endsWith('.json'))reports.push(resolve(folder,file));
  }
  const scores=new Map();
  for(const file of reports) {
    const lhr=JSON.parse(await readFile(file,'utf8'));
    assert.ok(!lhr.runtimeError,'Lighthouse não concluiu uma rota.');
    const requested=new URL(lhr.requestedUrl).href;
    assert.ok(urls.includes(requested),'Relatório para URL inesperada.');
    const finalUrl=new URL(lhr.finalDisplayedUrl??lhr.finalUrl);
    const route=pathname=>pathname.replace(/\/+$/,'')||'/';
    assert.equal(finalUrl.origin,new URL(requested).origin,'URL auditada mudou de domínio.');
    assert.equal(route(finalUrl.pathname),route(new URL(requested).pathname),'URL auditada redirecionou para outra página.');
    assert.equal(lhr.categories?.seo?.score,1,'SEO abaixo de 100: '+new URL(requested).pathname);
    assert.ok(!scores.has(requested),'Relatório duplicado para a mesma URL.');
    scores.set(requested,100);
  }
  assert.equal(scores.size,urls.length,'Todas as URLs públicas precisam de relatório SEO 100.');
  const summary={auditedAt:new Date().toISOString(),origin,codeRevision:process.env.SITE_REVISION??null,minimumScore:100,concurrency:shards.length,tool:'@lhci/cli@0.15.1',routes:[...scores].map(([url,score])=>({path:new URL(url).pathname,score}))};
  await writeFile(resolve(reportRoot,'summary-latest.json'),JSON.stringify(summary,null,2)+'\n');
  console.log(`SEO obrigatório: ${scores.size} páginas públicas, todas com 100/100.`);
} finally {
  if(server){server.closeAllConnections();await new Promise(resolveClosed=>server.close(resolveClosed));}
}
