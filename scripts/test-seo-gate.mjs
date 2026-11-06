/** External regression: real Lighthouse must reject a page with missing description. */
import assert from 'node:assert/strict';
import { mkdtemp,mkdir,writeFile,readdir,readFile,rm,rmdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root=resolve(import.meta.dirname,'..');
const fixture=await mkdtemp(resolve(root,'.angular/seo-negative-'));
try {
  await mkdir(resolve(fixture,'blog'));
  await writeFile(resolve(fixture,'blog/index.html'),'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Verificação negativa SEO</title><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="canonical" href="https://calcmot.com.br/blog/"></head><body><main><h1>Verificação negativa</h1><p>Conteúdo temporário usado somente no teste local do gate.</p></main></body></html>');
  await writeFile(resolve(fixture,'sitemap.xml'),'<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://calcmot.com.br/blog/</loc></url></urlset>');
  const result=spawnSync(process.execPath,[resolve(root,'scripts/audit-public-seo.mjs'),fixture],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024});
  if(result.error)throw result.error;
  const log=(result.stdout??'')+(result.stderr??'');
  await writeFile(resolve(root,'.angular/seo-negative-gate.log'),log);
  assert.notEqual(result.status,0,'Uma página com SEO abaixo de 100 foi aceita.');
  const reportRoot=log.match(/Relatórios SEO: ([^\r\n]+)/)?.[1];assert.ok(reportRoot,'Lighthouse não chegou a auditar a página negativa.');
  const files=(await readdir(resolve(reportRoot,'.lighthouseci'))).filter(file=>file.startsWith('lhr-')&&file.endsWith('.json'));
  assert.equal(files.length,1);
  const lhr=JSON.parse(await readFile(resolve(reportRoot,'.lighthouseci',files[0]),'utf8'));
  assert.equal(lhr.audits['meta-description'].score,0,'O erro SEO esperado não foi identificado.');
  assert.ok(lhr.categories.seo.score<1);
  console.log('Gate SEO: Lighthouse detectou a descrição ausente e bloqueou a nota abaixo de 100.');
} finally {
  await rm(resolve(fixture,'blog/index.html'),{force:true});await rm(resolve(fixture,'sitemap.xml'),{force:true});
  await rmdir(resolve(fixture,'blog'));await rmdir(fixture);
}
