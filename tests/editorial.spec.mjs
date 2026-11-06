import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { stringify } from 'yaml';
import { emptySnapshot, updateSnapshot, sealSnapshot, verifySnapshot, parseArticle, contentPath, MANIFEST } from '../scripts/editorial/snapshot.mjs';
import { parseRequest, productionGate, cloudflareBuildGate } from '../scripts/editorial/request.mjs';
import { git, promote, isAncestor, verifyRequestRevision } from '../scripts/editorial/git.mjs';
import { cloudflareClient, weights, restoreIfOwned } from '../scripts/editorial/cloudflare.mjs';
import { distribute } from '../scripts/editorial/distribute.mjs';
const SHA = 'a'.repeat(40), BLOB = 'b'.repeat(40), CODE = 'c'.repeat(40);
const article = (title='Conta por km', extra={}, body='## A conta\n\nTexto útil e específico para explicar o custo por quilômetro.') => '---\n' + stringify({title,category:'lucro-por-quilometro',cover:'/media/blog/cover.png',...extra}) + '---\n' + body;
const payload = (extra={}) => JSON.stringify({source:'pages-cms',repository:{owner:'DUGELO',repo:'calcmot-content',ref:'main',sha:SHA},action:{name:'publish'},context:{type:'entry',name:'articles',path:'articles/conta.md',data:{sha:BLOB}},...extra});
async function workspace(fn) {
  const root = await mkdtemp(resolve(tmpdir(),'calcmot-private-editorial-'));
  const image = await sharp({create:{width:1280,height:720,channels:3,background:'#1768f9'}}).png().toBuffer();
  await emptySnapshot(root);
  try { await fn(root,image); } finally { await rm(root,{recursive:true,force:true}); }
}
async function publish(root,image,{path='articles/conta.md',raw=article(),day='2026-10-29',sourceRevision=SHA,sourceBlob=BLOB,id='101-1'}={}) {
  const result=await updateSnapshot({root,path,raw,day,sourceRevision,sourceBlob,readMedia:async()=>image});
  if(result.changed) await sealSnapshot({root,manifest:result.manifest,releaseId:id,codeRevision:CODE});
  return result;
}
test('Request seleciona revisão salva e rejeita contexto e caminhos adulterados',()=>{
  assert.equal(parseRequest(payload()).sourceBlob,BLOB);
  for(const change of [
    {source:'unknown'}, {action:{name:'deploy-shell'}},
    {repository:{owner:'DUGELO',repo:'calcmot-site',ref:'main',sha:SHA}},
    {context:{type:'entry',name:'articles',path:'articles/../secret.md',data:{sha:BLOB}}},
    {context:{type:'entry',name:'articles',path:'articles/conta.md',data:{sha:'invalid'}}},
  ]) assert.throws(()=>parseRequest(payload(change)));
  for(const path of ['../secret','media/../x.png','media/a.svg','media/x%2fy.png','articles/x;curl.md']) assert.throws(()=>contentPath(path));
});
test('Produção exige autorização geral, autoridade única e repo/ref corretos',()=>{
  const allowed={CALCMOT_DEPLOY_AUTHORITY:'private-actions',CALCMOT_PRODUCTION_ENABLED:'true',GITHUB_REPOSITORY:'DUGELO/calcmot-content',GITHUB_REF:'refs/heads/main'};
  assert.doesNotThrow(()=>productionGate(allowed));
  for(const key of Object.keys(allowed)) assert.throws(()=>productionGate({...allowed,[key]:''}));
  assert.throws(()=>cloudflareBuildGate({WORKERS_CI:'1',WORKERS_CI_BRANCH:'main',CALCMOT_ALLOW_EMPTY_CONTENT:'1'}));
  assert.throws(()=>cloudflareBuildGate({}));
  assert.doesNotThrow(()=>cloudflareBuildGate({WORKERS_CI:'1',WORKERS_CI_BRANCH:'codex/blog'}));
});
test('Salvar e editar a área de trabalho não altera o snapshot público',()=>workspace(async(root,image)=>{
  await publish(root,image);
  const before=await readFile(resolve(root,'articles/conta.md'),'utf8');
  await mkdir(resolve(root,'.working')); await writeFile(resolve(root,'.working/draft.md'),article('ALTERAÇÃO PRIVADA'));
  assert.equal(await readFile(resolve(root,'articles/conta.md'),'utf8'),before);
  assert.ok(!(await verifySnapshot(root)).files.some(file=>file.path.includes('draft')));
}));
test('Publicação individual preserva outros artigos e deriva metadados',()=>workspace(async(root,image)=>{
  await publish(root,image);
  const first=await readFile(resolve(root,'articles/conta.md'),'utf8');
  await publish(root,image,{path:'articles/combustivel.md',raw:article('Custo do combustível',{},'## Outro cálculo\n\nUm resumo distinto sobre consumo e abastecimento.'),id:'102-1'});
  assert.equal(await readFile(resolve(root,'articles/conta.md'),'utf8'),first);
  const {data}=parseArticle(first);
  assert.equal(data.slug,'conta');assert.equal(data.author,'CalcMot');assert.equal(data.publishedAt,'2026-10-29');
  assert.ok(data.summary.startsWith('Texto útil'));
  const manifest=await verifySnapshot(root);
  assert.equal(manifest.files.filter(file=>file.path.startsWith('articles/')).length,2);
  assert.equal(manifest.files.filter(file=>file.path.startsWith('media/')).length,1);
}));
test('Substituir uma imagem compartilhada publica apenas a revisão do artigo selecionado',()=>workspace(async(root,image)=>{
  await publish(root,image);
  await publish(root,image,{path:'articles/segundo.md',raw:article('Segundo artigo',{summary:'Explicação específica sobre o segundo artigo e sua imagem.'}),id:'102-1'});
  const firstBefore=await readFile(resolve(root,'articles/conta.md'),'utf8');
  const oldCover=parseArticle(firstBefore).data.cover;
  const otherImage=await sharp({create:{width:1280,height:720,channels:3,background:'#ff5500'}}).png().toBuffer();
  const raw=article('Segundo artigo revisado',{},'## Exemplo\n\nTexto suficiente para explicar a nova imagem.\n\n![Imagem](/media/blog/cover.png)');
  await publish(root,otherImage,{path:'articles/segundo.md',raw,id:'103-1'});
  const second=parseArticle(await readFile(resolve(root,'articles/segundo.md'),'utf8'));
  assert.equal(await readFile(resolve(root,'articles/conta.md'),'utf8'),firstBefore);
  assert.notEqual(second.data.cover,oldCover);
  assert.ok(second.body.includes(second.data.cover));
  assert.deepEqual(await readFile(resolve(root,'media/'+oldCover.slice('/media/blog/'.length))),image);
  assert.deepEqual(await readFile(resolve(root,'media/'+second.data.cover.slice('/media/blog/'.length))),otherImage);
  assert.equal((await verifySnapshot(root)).files.filter(file=>file.path.startsWith('media/')).length,2);
  assert.equal((await publish(root,otherImage,{path:'articles/segundo.md',raw,id:'104-1'})).changed,false);
}));

test('Atualização preserva primeira publicação e todos os aliases anteriores',()=>workspace(async(root,image)=>{
  await publish(root,image);
  await publish(root,image,{raw:article('Conta revisada',{advanced:{slug:'conta-nova'}}),day:'2026-10-30',id:'103-1'});
  await publish(root,image,{raw:article('Conta melhorada',{advanced:{slug:'conta-nova'}}),day:'2026-10-31',id:'104-1'});
  const {data}=parseArticle(await readFile(resolve(root,'articles/conta.md'),'utf8'));
  assert.equal(data.publishedAt,'2026-10-29');assert.equal(data.updatedAt,'2026-10-31');assert.ok(data.aliases.includes('conta'));
}));
test('Publicação repetida sem mudança preserva datas e dispensa rebuild',()=>workspace(async(root,image)=>{
  await publish(root,image);
  const before=await readFile(resolve(root,MANIFEST),'utf8');
  const result=await publish(root,image,{day:'2026-11-01',id:'105-1'});
  assert.equal(result.changed,false);assert.equal(await readFile(resolve(root,MANIFEST),'utf8'),before);
}));
test('Aprovação sem mudança registra revisão nova e rejeita publicação antiga na fila',()=>workspace(async(root,image)=>{
  const repo=resolve(root,'editorial-source');
  execFileSync('git',['init',repo],{stdio:'ignore'});await mkdir(resolve(repo,'articles'));
  const save=async raw=>{
    await writeFile(resolve(repo,'articles/conta.md'),raw);git(repo,['add','-A']);
    git(repo,['-c','user.name=QA','-c','user.email=qa@users.noreply.github.com','commit','-m','save']);
    const revision=git(repo,['rev-parse','HEAD']).trim();
    return {revision,blob:git(repo,['rev-parse',revision+':articles/conta.md']).trim()};
  };
  const initial=await save(article());
  const stale=await save(article('Revisão intermediária'));
  const approved=await save(article());
  await publish(root,image,{sourceRevision:initial.revision,sourceBlob:initial.blob});
  const before=await verifySnapshot(root), beforeBody=await readFile(resolve(root,'articles/conta.md'),'utf8');
  const result=await publish(root,image,{sourceRevision:approved.revision,sourceBlob:approved.blob,day:'2026-11-01'});
  assert.equal(result.changed,false);assert.equal(result.metadataChanged,true);
  assert.equal(result.manifest.snapshotDigest,before.snapshotDigest);
  assert.equal(result.manifest.releaseId,before.releaseId);
  assert.equal(result.manifest.entries['articles/conta.md'].updatedAt,'2026-10-29');
  await writeFile(resolve(root,MANIFEST),JSON.stringify(result.manifest));
  await verifySnapshot(root);
  assert.equal(await readFile(resolve(root,'articles/conta.md'),'utf8'),beforeBody);
  assert.throws(()=>verifyRequestRevision(repo,{path:'articles/conta.md',sourceRevision:stale.revision,sourceBlob:stale.blob},approved.revision,result.manifest.entries['articles/conta.md']),/mais recente/);
}));

test('Retirada remove artigo e mídia sem uso preservando registro e histórico',()=>workspace(async(root,image)=>{
  await publish(root,image);
  const result=await updateSnapshot({root,path:'articles/conta.md',sourceRevision:SHA,sourceBlob:BLOB,operation:'withdraw'});
  await sealSnapshot({root,manifest:result.manifest,releaseId:'106-1',codeRevision:CODE});
  const manifest=await verifySnapshot(root);
  assert.equal(manifest.files.length,0);assert.equal(manifest.entries['articles/conta.md'].withdrawn,true);
}));
test('Falhas de conteúdo e imagens impedem validar o candidato',()=>workspace(async(root,image)=>{
  await assert.rejects(()=>publish(root,image,{raw:article('Título',{},'# Segundo H1')}));
  await assert.rejects(()=>publish(root,image,{raw:article('Título',{cover:'/media/blog/secret.svg'})}));
  await assert.rejects(()=>publish(root,Buffer.from('not an image')));
}));
test('Snapshot rejeita rascunho extra, mídia sem uso e alteração posterior à aprovação',()=>workspace(async(root,image)=>{
  await publish(root,image);
  await writeFile(resolve(root,'articles/rascunho.md'),article('SEGREDO'));
  await assert.rejects(()=>verifySnapshot(root),/extras/);
  await rm(resolve(root,'articles/rascunho.md'));
  await writeFile(resolve(root,'media/unused.png'),image);
  await assert.rejects(()=>verifySnapshot(root),/extras/);
  await rm(resolve(root,'media/unused.png'));
  await writeFile(resolve(root,'articles/conta.md'),article('ADULTERADO'));
  await assert.rejects(()=>verifySnapshot(root),/alterado/);
}));
test('Código novo preserva artigos/datas e snapshot anterior continua reproduzível',()=>workspace(async(root,image)=>{
  await publish(root,image);
  const saved=await readFile(resolve(root,MANIFEST),'utf8'), before=await readFile(resolve(root,'articles/conta.md'),'utf8');
  const old=JSON.parse(saved);
  await sealSnapshot({root,manifest:old,releaseId:'107-1',codeRevision:'d'.repeat(40)});
  assert.equal(await readFile(resolve(root,'articles/conta.md'),'utf8'),before);
  assert.notEqual((await verifySnapshot(root)).codeRevision,old.codeRevision);
  await writeFile(resolve(root,MANIFEST),saved);
  assert.equal((await verifySnapshot(root)).snapshotDigest,old.snapshotDigest);
}));
test('Falha de build/deploy/verificação nunca confirma publicação',async()=>{
  for(const failing of ['assertCurrent','persistCandidate','deploy','verify']) {
    const events=[], callbacks={};
    for(const name of ['assertCurrent','persistCandidate','deploy','verify','commit']) callbacks[name]=async()=>{events.push(name);if(name===failing)throw new Error('simulated failure');};
    await assert.rejects(()=>distribute(callbacks));assert.ok(!events.includes('commit'));
  }
  const events=[];await distribute(Object.fromEntries(['assertCurrent','persistCandidate','deploy','verify','commit'].map(name=>[name,async()=>events.push(name)])));
  assert.equal(events.at(-1),'commit');
});
test('CAS real do Git impede sobrescrita por publicação concorrente',()=>workspace(async(root)=>{
  const bare=resolve(root,'remote.git'), local=resolve(root,'repo');
  execFileSync('git',['init','--bare',bare],{stdio:'ignore'});execFileSync('git',['init',local],{stdio:'ignore'});
  const commit=message=>{git(local,['add','-A']);git(local,['-c','user.name=QA','-c','user.email=qa@users.noreply.github.com','commit','-m',message]);return git(local,['rev-parse','HEAD']).trim();};
  await writeFile(resolve(local,'state'),'initial');const initial=commit('initial');
  git(local,['remote','add','origin',bare]);git(local,['push','origin',initial+':refs/heads/published']);
  await writeFile(resolve(local,'state'),'newer');const newer=commit('newer');
  promote(local,newer,initial);assert.throws(()=>promote(local,initial,initial),/avançou/);
  assert.equal(git(local,['ls-remote','origin','refs/heads/published']).split(/\s/)[0],newer);assert.equal(isAncestor(local,initial,newer),true);
}));

test('Revisão antiga e blob divergente não substituem uma aprovação mais recente',()=>workspace(async(root)=>{
  const repo=resolve(root,'source');execFileSync('git',['init',repo],{stdio:'ignore'});
  await mkdir(resolve(repo,'articles'));
  const commit=()=>{git(repo,['add','-A']);git(repo,['-c','user.name=QA','-c','user.email=qa@users.noreply.github.com','commit','-m','save']);return git(repo,['rev-parse','HEAD']).trim();};
  await writeFile(resolve(repo,'articles/a.md'),article());const first=commit(), blob=git(repo,['rev-parse',first+':articles/a.md']).trim();
  await writeFile(resolve(repo,'articles/a.md'),article('Nova versão'));const second=commit();
  const req={path:'articles/a.md',sourceRevision:first,sourceBlob:blob};
  assert.throws(()=>verifyRequestRevision(repo,req,second,{sourceRevision:second}),/mais recente/);
  assert.throws(()=>verifyRequestRevision(repo,{...req,sourceBlob:'f'.repeat(40)},second),/mudou/);
  assert.doesNotThrow(()=>verifyRequestRevision(repo,req,second));
}));
test('Recuperar pela operação real restaura texto e mídia sem sobrescrever outro artigo',()=>workspace(async(root,image)=>{
  const remote=resolve(root,'history.git'),repo=resolve(root,'working');
  execFileSync('git',['init','--bare',remote],{stdio:'ignore'});execFileSync('git',['init','-b','main',repo],{stdio:'ignore'});
  await mkdir(resolve(repo,'articles'));await mkdir(resolve(repo,'media'));
  const save=()=>{git(repo,['add','-A']);git(repo,['-c','user.name=QA','-c','user.email=qa@users.noreply.github.com','commit','-m','save']);return git(repo,['rev-parse','HEAD']).trim();};
  await writeFile(resolve(repo,'articles/conta.md'),article('Versão anterior'));await writeFile(resolve(repo,'media/cover.png'),image);save();
  const newImage=await sharp({create:{width:1280,height:720,channels:3,background:'#61e329'}}).png().toBuffer();
  await writeFile(resolve(repo,'media/cover.png'),newImage);
  await writeFile(resolve(repo,'articles/conta.md'),article('Rascunho incompleto'));
  await writeFile(resolve(repo,'articles/outro.md'),article('Outro artigo intacto'));
  const head=save(),blob=git(repo,['rev-parse',head+':articles/conta.md']).trim();
  git(repo,['remote','add','origin',remote]);git(repo,['push','origin','main']);
  const request=payload({repository:{owner:'DUGELO',repo:'calcmot-content',ref:'main',sha:head},action:{name:'recover'},context:{type:'entry',name:'articles',path:'articles/conta.md',data:{sha:blob}},inputs:{steps:'1'}});
  execFileSync(process.execPath,['scripts/editorial/coordinate.mjs','recover'],{stdio:'pipe',env:{...process.env,EDITORIAL_REPO:repo,EDITORIAL_PAYLOAD:request,GITHUB_REPOSITORY:'DUGELO/calcmot-content',GITHUB_REF:'refs/heads/main'}});
  const restored=parseArticle(await readFile(resolve(repo,'articles/conta.md'),'utf8'));
  assert.equal(restored.data.title,'Versão anterior');assert.match(restored.data.cover,/recovered-/);
  assert.ok((await readFile(resolve(repo,'articles/outro.md'),'utf8')).includes('Outro artigo intacto'));
  assert.deepEqual(await readFile(resolve(repo,'media/cover.png')),newImage);
  assert.equal(git(repo,['rev-parse','HEAD']).trim(),git(repo,['ls-remote','origin','refs/heads/main']).split(/\s/)[0]);
}));

test('Falha no smoke reverte antes de confirmar; falha de registro usa reconciliação',async()=>{
  const events=[];
  await assert.rejects(()=>distribute({
    assertCurrent:async()=>{},persistCandidate:async()=>{},deploy:async()=>events.push('deploy'),
    verify:async()=>{throw new Error('smoke failed');},rollback:async()=>events.push('rollback'),
    commit:async()=>events.push('commit'),
  }));
  assert.deepEqual(events,['deploy','rollback']);
  const recorded=[];
  await assert.rejects(()=>distribute({
    assertCurrent:async()=>{},persistCandidate:async()=>{},deploy:async()=>{},verify:async()=>{},
    rollback:async()=>recorded.push('rollback'),commit:async()=>{throw new Error('record failure');},
  }));
  assert.deepEqual(recorded,[]);
});
test('Rollback conserva pesos anteriores e não sobrescreve distribuição externa',async()=>{
  const first='11111111-1111-4111-8111-111111111111',candidate='22222222-2222-4222-8222-222222222222',external='33333333-3333-4333-8333-333333333333';
  const previous={versions:[{version_id:first,percentage:100}]},switched=[];
  await restoreIfOwned({current:async()=>({versions:[{version_id:candidate,percentage:100}]}),switch:async versions=>switched.push(versions)},previous,candidate);
  assert.deepEqual(switched,[previous.versions]);
  await assert.rejects(()=>restoreIfOwned({current:async()=>({versions:[{version_id:external,percentage:100}]}),switch:async()=>assert.fail('external overwritten')},previous,candidate),/Outra distribuição/);
  assert.throws(()=>weights([{version_id:first,percentage:50}]),/incompleta/);
});
test('Cliente Cloudflare valida resposta e transmite apenas o contrato da distribuição',async()=>{
  const id='11111111-1111-4111-8111-111111111111', calls=[];
  const client=cloudflareClient({CLOUDFLARE_ACCOUNT_ID:'a'.repeat(32),CLOUDFLARE_API_TOKEN:'synthetic-test-value'},async(url,options)=>{
    calls.push({url,method:options.method,body:options.body});
    const result=options.method==='GET'?{deployments:[{id,created_on:'2026-11-01T12:00:00Z',versions:[{version_id:id,percentage:100}]}]}:{id,versions:[{version_id:id,percentage:100}]};
    return {ok:true,json:async()=>({success:true,result})};
  });
  assert.equal((await client.current()).id,id);
  await client.switch([{version_id:id,percentage:100}],'QA');
  assert.equal(JSON.parse(calls[1].body).strategy,'percentage');
  assert.ok(calls[0].url.endsWith('/workers/scripts/calcmot-site/deployments'));
});
