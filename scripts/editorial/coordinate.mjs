import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { cloudflareClient, restoreIfOwned } from './cloudflare.mjs';
import { distribute } from './distribute.mjs';
import { stringify } from 'yaml';
import { createHash } from 'node:crypto';
import { parseRequest, productionGate } from './request.mjs';
import { verifySnapshot, updateSnapshot, sealSnapshot, parseArticle, mediaReferences, MANIFEST } from './snapshot.mjs';
import { git, gitRead, isAncestor, verifyRequestRevision, promote } from './git.mjs';

const env = process.env;
const repository = resolve(env.EDITORIAL_REPO ?? '');
const stage = resolve(env.CALCMOT_CONTENT_ROOT ?? '.angular/editorial-candidate');
const codeRoot = resolve(import.meta.dirname, '../..');
const planFile = resolve(codeRoot, '.angular/editorial-plan.json');
const run = (script, args = []) => execFileSync(process.execPath, [resolve(codeRoot, script), ...args], { cwd: codeRoot, stdio: 'inherit', env });
const output = async (key, value) => { if (env.GITHUB_OUTPUT) await writeFile(env.GITHUB_OUTPUT, key + '=' + value + '\n', { flag: 'a' }); };
const auditSeo = (args, contentRoot = stage) => execFileSync(process.execPath, [resolve(codeRoot, 'scripts/audit-public-seo.mjs'), ...args], { cwd: codeRoot, stdio: 'inherit', env: { ...Object.fromEntries(Object.entries(env).filter(([key]) => !/TOKEN|SECRET|PRIVATE_KEY|PASSWORD/i.test(key))), CALCMOT_CONTENT_ROOT: contentRoot } });
const releaseMatches = (a, b) => a?.releaseId === b?.releaseId && a?.snapshotDigest === b?.snapshotDigest && a?.codeRevision === b?.codeRevision;
async function remoteReceipt() {
  const response = await fetch('https://calcmot.com.br/blog-release.json', { cache: 'no-store', signal: AbortSignal.timeout(15_000) });
  if (!response.ok) return null;
  const receipt = await response.json();
  if (!/^[a-zA-Z0-9-]{1,80}$/.test(receipt.releaseId ?? '') || !/^[a-f0-9]{40}$/.test(receipt.codeRevision ?? '') || !/^[a-f0-9]{64}$/.test(receipt.snapshotDigest ?? '')) throw new Error('Recibo público de publicação inválido.');
  return receipt;
}
async function reconcile(expected, previous) {
  if (previous.releaseId === 'bootstrap') return expected;
  const receipt = await remoteReceipt();
  if (releaseMatches(receipt, previous)) return expected;
  if (!receipt || !/^[0-9]+-[0-9]+$/.test(receipt.releaseId)) throw new Error('A versão no ar não corresponde ao snapshot registrado. A publicação foi bloqueada para preservar o site.');
  const candidate = git(repository, ['rev-parse', 'refs/tags/releases/' + receipt.releaseId]).trim();
  const approved = JSON.parse(git(repository, ['show', candidate + ':' + MANIFEST]));
  if (!releaseMatches(receipt, approved) || !isAncestor(repository, expected, candidate)) throw new Error('Não foi possível reconciliar a publicação anterior com segurança.');
  const recoveredRoot=resolve(codeRoot,'.angular/editorial-reconcile');
  git(repository,['worktree','add','--detach',recoveredRoot,candidate]);
  try {
    await verifySnapshot(recoveredRoot);
    execFileSync(process.execPath,[resolve(codeRoot,'scripts/editorial/smoke.mjs'),'https://calcmot.com.br'],{
      cwd:codeRoot,stdio:'inherit',env:{...env,CALCMOT_CONTENT_ROOT:recoveredRoot},
    });
    auditSeo(['--origin=https://calcmot.com.br'], recoveredRoot);
    promote(repository,candidate,expected);
  } finally { git(repository,['worktree','remove',recoveredRoot]); }
  return candidate;
}
async function prepare() {
  productionGate(env);
  if (!env.EDITORIAL_REPO || !env.CALCMOT_CONTENT_ROOT || !/^[a-f0-9]{40}$/.test(env.SITE_REVISION ?? '') || !/^[0-9]+-[0-9]+$/.test(env.EDITORIAL_RELEASE_ID ?? '')) throw new Error('Configuração da publicação incompleta.');
  const request = env.EDITORIAL_OPERATION === 'rebuild' || env.EDITORIAL_OPERATION === 'rollback'
    ? { operation: env.EDITORIAL_OPERATION }
    : parseRequest(env.EDITORIAL_PAYLOAD ?? '', env.EDITORIAL_WORKING_REF ?? 'main');
  if (request.operation === 'recover') throw new Error('Recuperação não é publicação.');
  git(repository, ['fetch', 'origin', 'main', 'published', '--tags']);
  let expected = git(repository, ['rev-parse', 'origin/published']).trim();
  let previous = JSON.parse(git(repository, ['show', expected + ':' + MANIFEST]));
  if (request.operation !== 'rollback') expected = await reconcile(expected, previous);
  previous = JSON.parse(git(repository, ['show', expected + ':' + MANIFEST]));
  if (request.operation !== 'rollback' && previous.codeRevision && !isAncestor(codeRoot, previous.codeRevision, env.SITE_REVISION)) throw new Error('Uma versão de código mais recente já foi publicada.');
  git(repository, ['worktree', 'add', '--detach', stage, expected]);
  await verifySnapshot(stage);
  let changed = true, metadataChanged = false, manifest = previous;
  if (request.operation === 'rollback') {
    if (!/^[0-9]+-[0-9]+$/.test(env.EDITORIAL_ROLLBACK_RELEASE ?? '')) throw new Error('Escolha uma publicação válida para restaurar.');
    const tag = 'refs/tags/releases/' + env.EDITORIAL_ROLLBACK_RELEASE;
    const oldCommit = git(repository, ['rev-parse', tag]).trim();
    const old = JSON.parse(git(repository, ['show', oldCommit + ':' + MANIFEST]));
    if (old.codeRevision !== env.SITE_REVISION) throw new Error('O rollback precisa do código e do conteúdo da mesma publicação.');
    for (const file of previous.files) await rm(resolve(stage, file.path));
    for (const file of old.files) {
      await mkdir(resolve(stage, file.path, '..'), { recursive: true });
      await writeFile(resolve(stage, file.path), gitRead(repository, oldCommit, file.path));
    }
    manifest = old;
  } else if (request.operation !== 'rebuild') {
    const workingHead = git(repository, ['rev-parse', 'origin/' + (env.EDITORIAL_WORKING_REF ?? 'main')]).trim();
    verifyRequestRevision(repository, request, workingHead, previous.entries[request.path]);
    const result = await updateSnapshot({
      root: stage, path: request.path, operation: request.operation,
      raw: gitRead(repository, request.sourceRevision, request.path),
      sourceRevision: request.sourceRevision, sourceBlob: request.sourceBlob,
      readMedia: path => gitRead(repository, request.sourceRevision, path),
    });
    changed = result.changed; metadataChanged = result.metadataChanged; manifest = result.manifest;
  } else changed = previous.codeRevision !== env.SITE_REVISION;
  if (!changed) {
    if (metadataChanged) {
      // Record approval intent even when the public bytes are unchanged. Otherwise
      // an older queued request could overwrite this newer approval.
      await writeFile(resolve(stage, MANIFEST), JSON.stringify(manifest, null, 2) + '\n');
      await verifySnapshot(stage);
      git(stage, ['add', MANIFEST]);
      git(stage, ['-c','user.name=CalcMot Editorial','-c','user.email=editorial@users.noreply.github.com','commit','-m','Record unchanged editorial approval']);
      promote(repository, git(stage, ['rev-parse','HEAD']).trim(), expected);
    }
    await output('changed', 'false'); return;
  }
  manifest={...manifest,lastOperation:{
    type:request.operation,path:request.path ?? null,
    removedSlug:request.operation==='withdraw'?previous.entries[request.path]?.slug:null,
  }};
  await sealSnapshot({ root: stage, manifest, releaseId: env.EDITORIAL_RELEASE_ID, codeRevision: env.SITE_REVISION });
  // Decoder output validates media but never becomes part of the private snapshot.
  await rm(resolve(stage, '.release/validated-images'), { recursive: true, force: true });
  git(stage, ['add', '-A']);
  git(stage, ['-c','user.name=CalcMot Editorial','-c','user.email=editorial@users.noreply.github.com','commit','-m','Approve editorial release ' + env.EDITORIAL_RELEASE_ID]);
  const candidate = git(stage, ['rev-parse','HEAD']).trim();
  await mkdir(resolve(codeRoot, '.angular'), { recursive: true });
  await writeFile(planFile, JSON.stringify({ expected, candidate, releaseId: env.EDITORIAL_RELEASE_ID }));
  await output('changed','true');
}
async function packageWorker() {
  const ts = (await import('typescript')).default;
  const config = ts.parseConfigFileTextToJson('wrangler.jsonc', await readFile(resolve(codeRoot,'wrangler.jsonc'),'utf8')).config;
  delete config.build;
  config.keep_vars = true;
  config.main = resolve(codeRoot, config.main);
  config.assets.directory = resolve(codeRoot, config.assets.directory);
  await mkdir(resolve(codeRoot,'.angular/editorial-deploy'), { recursive: true });
  await writeFile(resolve(codeRoot,'.angular/editorial-deploy/wrangler.json'), JSON.stringify(config,null,2));
  run('node_modules/wrangler/bin/wrangler.js', ['deploy','--dry-run','--config','.angular/editorial-deploy/wrangler.json','--outdir','.angular/editorial-deploy/worker']);
}
async function deploy() {
  productionGate(env);
  const plan=JSON.parse(await readFile(planFile,'utf8')), manifest=await verifySnapshot(stage);
  if(manifest.releaseId!==plan.releaseId || manifest.codeRevision!==env.SITE_REVISION)throw new Error('Artefato de publicação divergente.');
  auditSeo([resolve(codeRoot, 'dist/calcmot-cloudflare/browser')]);
  const client=cloudflareClient(env), previous=await client.current();
  let candidateId;
  await distribute({
    assertCurrent:async()=>{
      if(git(repository,['ls-remote','origin','refs/heads/published']).split(/\s/)[0]!==plan.expected)throw new Error('Outra publicação avançou.');
    },
    persistCandidate:async()=>{
      await writeFile(resolve(stage,'.release/previous-deployment.json'),JSON.stringify(previous));
      git(stage,['add','.release/previous-deployment.json']);
      git(stage,['-c','user.name=CalcMot Editorial','-c','user.email=editorial@users.noreply.github.com','commit','-m','Record previous delivery for recovery']);
      plan.candidate=git(stage,['rev-parse','HEAD']).trim();
      await writeFile(planFile,JSON.stringify(plan));
      git(repository,['push','origin',plan.candidate+':refs/tags/releases/'+plan.releaseId]);
    },
    deploy:async()=>{
      const upload=execFileSync(process.execPath,[resolve(codeRoot,'node_modules/wrangler/bin/wrangler.js'),
        'versions','upload','--config','.angular/editorial-deploy/wrangler.json','--keep-vars','--tag','calcmot-'+plan.releaseId,
      ],{cwd:codeRoot,encoding:'utf8',stdio:['ignore','pipe','pipe'],env:{...env,NO_COLOR:'1'}});
      candidateId=upload.match(/Worker Version ID:\s*([a-f0-9-]{36})/i)?.[1];
      if(!candidateId)throw new Error('A versão foi enviada sem alterar tráfego, mas seu ID não foi confirmado.');
      if((await client.current()).id!==previous.id)throw new Error('Outra distribuição avançou antes da promoção.');
      await client.switch([{version_id:candidateId,percentage:100}],'CalcMot editorial '+plan.releaseId);
    },
    verify:async()=>{
      let confirmed=false;
      for(let attempt=0;attempt<12;attempt++){
        try{confirmed=releaseMatches(await remoteReceipt(),manifest);}catch{}
        if(confirmed)break;
        await new Promise(resolve=>setTimeout(resolve,5000));
      }
      if(!confirmed)throw new Error('Distribuição não confirmada. A publicação não foi marcada como concluída.');
      run('scripts/editorial/smoke.mjs',['https://calcmot.com.br']);
      auditSeo(['--origin=https://calcmot.com.br']);
    },
    rollback:async()=>{await restoreIfOwned(client,previous,candidateId);},
    commit:async()=>{promote(repository,plan.candidate,plan.expected);},
  });
  console.log('Publicação distribuída e registrada com sucesso.');
}
async function recover() {
  if (env.GITHUB_REPOSITORY?.toLowerCase() !== 'dugelo/calcmot-content' || env.GITHUB_REF !== 'refs/heads/main') throw new Error('Recuperação disponível apenas no ambiente editorial autorizado.');
  const request = parseRequest(env.EDITORIAL_PAYLOAD ?? '');
  if (request.operation !== 'recover') throw new Error('Solicitação de recuperação inválida.');
  git(repository,['fetch','origin','main']);
  const head = git(repository,['rev-parse','origin/main']).trim();
  const blob = git(repository,['rev-parse',head + ':' + request.path]).trim();
  if (blob !== request.sourceBlob) throw new Error('O rascunho mudou. Reabra-o antes de recuperar um salvamento.');
  const commits = git(repository,['log','--format=%H',head,'--',request.path]).trim().split('\n');
  const versions = [], seen = new Set();
  for (const commit of commits) {
    const value = git(repository,['rev-parse',commit + ':' + request.path]).trim();
    if (!seen.has(value)) { seen.add(value); versions.push({commit,blob:value}); }
    if (versions.length > request.steps) break;
  }
  const selected = versions[request.steps];
  if (!selected) throw new Error('Este artigo ainda não tem tantos salvamentos anteriores.');
  git(repository,['checkout','--detach',head]);

  const restored=parseArticle(gitRead(repository,selected.commit,request.path));
  const restoredMedia=[];
  for (const mediaPath of mediaReferences(restored.data,restored.body)) {
    const bytes=gitRead(repository,selected.commit,mediaPath);
    const current=git(repository,['ls-tree',head,'--',mediaPath]).trim();
    let target=mediaPath;
    if(current) {
      const currentBytes=gitRead(repository,head,mediaPath);
      if(bytes.equals(currentBytes)) continue;
      target='media/recovered-'+createHash('sha256').update(bytes).digest('hex').slice(0,20)+'.'+mediaPath.split('.').at(-1);
      const oldUrl='/media/blog/'+mediaPath.slice(6), newUrl='/media/blog/'+target.slice(6);
      if(restored.data.cover===oldUrl)restored.data.cover=newUrl;
      restored.body=restored.body.replaceAll(oldUrl,newUrl);
    }
    await mkdir(resolve(repository,target,'..'),{recursive:true});
    await writeFile(resolve(repository,target),bytes);
    restoredMedia.push(target);
  }
  await writeFile(resolve(repository,request.path),'---\n'+stringify(restored.data)+'---\n'+restored.body);
  git(repository,['add','--',request.path,...restoredMedia]);
  git(repository,['-c','user.name=CalcMot Editorial','-c','user.email=editorial@users.noreply.github.com','commit','-m','Recover saved editorial revision']);
  // No force push: a concurrent editor save wins and recovery fails visibly.
  git(repository,['push','origin','HEAD:refs/heads/main']);
  console.log('Salvamento recuperado. A versão pública permanece inalterada.');
}
try {
  switch (process.argv[2]) {
    case 'prepare': await prepare(); break;
    case 'package': await packageWorker(); break;
    case 'deploy': await deploy(); break;
    case 'recover': await recover(); break;
    default: throw new Error('Comando editorial inválido.');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
