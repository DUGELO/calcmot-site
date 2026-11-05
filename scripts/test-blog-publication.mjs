/** End-to-end editorial publication, using temporary content removed in finally. Never deploys. */
import assert from 'node:assert/strict';
import { writeFile, mkdir, rm, readFile, readdir, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { spawn, execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { stringify } from 'yaml';
import { emptySnapshot, sealSnapshot } from './editorial/snapshot.mjs';
const root = resolve(import.meta.dirname, '..');
process.chdir(root);
const fixtureRoot = resolve(root, '.angular/blog-publication');
const output = resolve(fixtureRoot, 'node');
const ownedFiles = [];
const originalSource = process.env.CALCMOT_CONTENT_ROOT;
const source = resolve(fixtureRoot, 'content');
let server;
const run = (script, args = []) => execFileSync(process.execPath, [script, ...args], { stdio: 'inherit', env: process.env });
const ready = async base => {
  for (let i = 0; i < 150; i++) {
    try { if ((await fetch(base + '/blog/')).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error('Servidor SSR não iniciou.');
};
const create = async (path, contents) => {
  if (await access(path).then(() => true, () => false)) throw new Error('Fixture já existe: ' + path);
  ownedFiles.push(path); await writeFile(path, contents);
};
try {
  await mkdir(fixtureRoot, { recursive: true });
  await mkdir(resolve(source,'articles'),{recursive:true});
  await mkdir(resolve(source,'media'),{recursive:true});
  const snapshot = await emptySnapshot(source);
  process.env.CALCMOT_CONTENT_ROOT = source;
  process.env.CALCMOT_ALLOW_EMPTY_CONTENT = '1';
  const cover = await sharp({ create: { width: 1600, height: 900, channels: 3, background: '#1768f9' } }).png().toBuffer();
  await create(resolve(source, 'media/qa-publication.png'), cover);
  for (let i = 1; i <= 13; i++) {
    const metadata = {
      title: 'Teste editorial ' + i, slug: 'qa-artigo-' + i,
      summary: 'Resumo específico para homologação editorial ' + i + '.',
      category: 'lucro-por-quilometro', author: i === 1 ? 'CalcMot' : 'Equipe QA',
      publishedAt: '2026-01-10', updatedAt: '2026-02-12', status: 'published',
      cover: '/media/blog/qa-publication.png', coverAlt: 'Ilustração temporária de homologação',
      aliases: i === 1 ? ['qa-antigo'] : [],
    };
    await create(resolve(source, 'articles/qa-publication-' + i + '.md'), '---\n' + stringify(metadata) + '---\n## A conta do teste\n\nCALCMOT_QA_BODY_' + i + '\n\n[Calculadora](/ferramentas/corrida-vale-a-pena/).\n\n### Exemplo verificável\n\n**Fim integral do artigo ' + i + '.**');
  }
  for (let i=1;i<=13;i++) snapshot.entries['articles/qa-publication-' + i + '.md'] = {
    sourceRevision:'a'.repeat(40), sourceBlob:'b'.repeat(40), slug:'qa-artigo-' + i, withdrawn:false,
  };
  await sealSnapshot({root:source,manifest:snapshot,releaseId:'999001-1',codeRevision:'c'.repeat(40)});
  await create(resolve(fixtureRoot, 'working-draft.md'), '---\nstatus: draft\nslug: qa-rascunho\ntitle: CALCMOT_DRAFT_SECRET\n---\nCALCMOT_DRAFT_BODY');
  run('scripts/generate-blog.mjs'); run('scripts/generate-sitemap.mjs');
  run('node_modules/@angular/cli/bin/ng.js', ['build', '--output-path', output]);
  run('scripts/verify-blog-build.mjs', [resolve(output, 'browser')]);
  for (const name of await readdir(resolve(output, 'browser'))) if (name.endsWith('.js')) {
    assert.ok(!(await readFile(resolve(output, 'browser', name), 'utf8')).includes('CALCMOT_DRAFT'), 'Rascunho vazou no bundle');
  }
  const index = await readFile(resolve(output, 'browser/blog/index.html'), 'utf8');
  assert.ok(index.includes('/blog/pagina/2/'));
  const article = await readFile(resolve(output, 'browser/blog/qa-artigo-1/index.html'), 'utf8');
  assert.ok(article.includes('CALCMOT_QA_BODY_1') && article.includes('Fim integral do artigo 1.'), 'Conteúdo incompleto no HTML inicial');
  assert.ok(!(await readFile(resolve(output, 'browser/sitemap.xml'), 'utf8')).includes('qa-rascunho'));
  // Port 0 is not supported by the existing server bootstrap (it uses an env string).
  const port = process.env.CALCMOT_BLOG_TEST_PORT ?? '4187';
  server = spawn(process.execPath, [resolve(output, 'server/server.mjs')], { env: { ...process.env, PORT: port }, stdio: ['ignore','pipe','pipe'] });
  server.stderr.on('data', chunk => process.stderr.write(chunk));
  const base = 'http://localhost:' + port;
  await ready(base);
  for (const path of ['/blog/qa-rascunho/', '/blog/ausente/', '/blog/a/b/', '/blog/pagina/999/', '/blog/pagina/02/', '/blog/pagina/invalid/']) {
    const response = await fetch(base + path, { redirect: 'manual' });
    assert.equal(response.status, 404, path);
    assert.match(await response.text(), /noindex,follow/);
  }
  assert.equal((await fetch(base + '/blog/qa-antigo/', { redirect: 'manual' })).status, 301);
  assert.equal((await fetch(base + '/blog/pagina/2/')).status, 200);
  if (process.env.CALCMOT_BLOG_UI_PYTHON) execFileSync(process.env.CALCMOT_BLOG_UI_PYTHON, ['scripts/e2e-blog.py', base, fixtureRoot], { stdio: 'inherit' });
  // Actual neutral Angular bundle and workerd Assets, without a production deployment.
  run('node_modules/wrangler/bin/wrangler.js', ['deploy','--dry-run','--config','wrangler.jsonc','--outdir','.angular/worker-dryrun']);
  run('scripts/verify-blog-workerd.mjs', ['--fixtures']);
  console.log('Publicação editorial: SSR/SSG integral, 13 publicados, rascunho excluído, paginação, redirects e workerd OK.');
} finally {
  if (server) { server.kill(); await new Promise(resolve => server.once('close', resolve)); }
  // Only exact files owned by this run; never remove the real editorial collection.
  for (const file of ownedFiles) await rm(file, { force: true });
  if (originalSource === undefined) delete process.env.CALCMOT_CONTENT_ROOT;
  else process.env.CALCMOT_CONTENT_ROOT = originalSource;
  run('scripts/generate-blog.mjs'); run('scripts/generate-sitemap.mjs');
  run('scripts/build-cloudflare.mjs');
  assert.ok(!existsSync(resolve(root, 'dist/calcmot-cloudflare/browser/blog/qa-artigo-1/index.html')), 'Artigo retirado permaneceu no artefato');
  assert.ok(!existsSync(resolve(root, 'dist/calcmot-cloudflare/browser/media/blog/qa-publication.png')), 'Imagem removida permaneceu no workspace Cloudflare');
}
