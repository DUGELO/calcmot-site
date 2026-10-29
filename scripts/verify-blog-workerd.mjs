import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import ts from 'typescript';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
const config = ts.parseConfigFileTextToJson('wrangler.jsonc', await readFile('wrangler.jsonc','utf8')).config;
const options = { workers: [{ name: 'calcmot-site', modules: true,
  scriptPath: resolve('.angular/worker-dryrun/worker.js'),
  compatibilityDate: process.env.ADMIN_WORKER_TEST_DATE ?? '2026-10-13',
  assets: { routerConfig: { has_user_worker: true }, directory: resolve(config.assets.directory), binding: 'ASSETS', run_worker_first: config.assets.run_worker_first },
}] };
const runtime = new Miniflare(convertV4MiniflareOptions ? convertV4MiniflareOptions(options) : options);
try {
  for (const path of ['/blog/ausente/','/blog/qa-rascunho/','/blog/pagina/999/','/blog/categoria/ausente/','/blog/a/b/']) {
    const response = await runtime.dispatchFetch('https://calcmot.com.br' + path, { redirect: 'manual' });
    assert.equal(response.status,404,path);
    assert.match(response.headers.get('X-Robots-Tag'),/noindex/);
  }
  const html = await (await runtime.dispatchFetch('https://calcmot.com.br/blog/')).text();
  assert.match(html, /<h1/);
  if (process.argv.includes('--fixtures')) {
    const article = await runtime.dispatchFetch('https://calcmot.com.br/blog/qa-artigo-1/');
    assert.equal(article.status,200);
    assert.match(await article.text(), /CALCMOT_QA_BODY_1/);
    assert.equal((await runtime.dispatchFetch('https://calcmot.com.br/blog/pagina/2/')).status,200);
    const redirect = await runtime.dispatchFetch('https://calcmot.com.br/blog/qa-antigo/', { redirect: 'manual' });
    assert.equal(redirect.status,301);
    assert.equal(redirect.headers.get('Location'),'https://calcmot.com.br/blog/qa-artigo-1/');
  }
  console.log('Blog no workerd real: Assets, HTML inicial, 404/noindex e redirects OK.');
} finally { await runtime.dispose(); }
