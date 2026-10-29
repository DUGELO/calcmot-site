import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { parse } from 'yaml';
import { readFileSync } from 'node:fs';
import { loadPosts, renderMarkdown, safeLink, listingPaths, canonical, editorialToday } from '../scripts/blog/content.mjs';
import { withBlogRouting } from '../cloudflare/blog-routing.mjs';

const post = (overrides = {}, body = '## A conta\n\nExemplo verificável com [calculadora](/ferramentas/corrida-vale-a-pena/).') => {
  const metadata = { title: 'Conta por quilômetro', slug: 'conta-por-km', summary: 'Resumo específico do teste editorial.', category: 'lucro-por-quilometro', author: 'Equipe de teste', publishedAt: '2026-01-10', updatedAt: '2026-02-12', status: 'published', cover: '/media/blog/test.png', coverAlt: 'Imagem de teste', ...overrides };
  return '---\n' + Object.entries(metadata).map(([k,v]) => k + ': ' + JSON.stringify(v)).join('\n') + '\n---\n' + body;
};
async function workspace(fn) {
  const root = await mkdtemp(resolve(tmpdir(), 'calcmot-blog-'));
  await mkdir(resolve(root, 'content/blog'), { recursive: true });
  await mkdir(resolve(root, 'public/media/blog'), { recursive: true });
  await sharp({ create: { width: 1600, height: 900, channels: 3, background: '#1768f9' } }).png().toFile(resolve(root, 'public/media/blog/test.png'));
  try { await fn(root, (name, content) => writeFile(resolve(root, 'content/blog', name), content)); }
  finally { await rm(root, { recursive: true, force: true }); }
}
test('CMS cobre campos editoriais e defaults seguros', () => {
  const config = parse(readFileSync('.pages.yml', 'utf8'));
  const fields = config.content[0].fields;
  for (const name of ['title','slug','summary','cover','coverAlt','category','author','publishedAt','updatedAt','status','body','seoTitle','seoDescription','canonical','aliases']) assert.ok(fields.some(f => f.name === name), name);
  assert.equal(fields.find(f => f.name === 'status').default, 'draft');
  assert.equal(config.media.output, '/media/blog');
  assert.equal(config.content[0].filename, '{fields.slug}.md');
});
test('Markdown seguro, sem H1 duplicado ou salto de hierarquia', () => {
  const html = renderMarkdown('## Conta\n\n<script>alert(1)</script>\n\n[abrir](javascript:alert(1))\n\n**Exemplo**');
  assert.ok(!html.includes('<script>') && !html.includes('href="javascript:'));
  assert.ok(html.includes('<strong>Exemplo</strong>'));
  assert.throws(() => renderMarkdown('# Outro H1'));
  assert.throws(() => renderMarkdown('### Salto'));
  assert.throws(() => renderMarkdown('## Conta\n\n![rastreio](https://tracker.invalid/a.png)'));
  for (const link of ['javascript:alert(1)','data:text/html,x','//evil.invalid','/\\evil.invalid','https://user:pass@example.com']) assert.equal(safeLink(link), false, link);
  assert.equal(safeLink('https://www.gov.br/'), true);
  assert.equal(safeLink('/ferramentas/corrida-vale-a-pena/'), true);
  assert.throws(() => canonical('http://example.com', 'slug'));
});
test('Publicação exclui rascunho de todo o catálogo e otimiza a capa', () => workspace(async (root, write) => {
  await write('published.md', post());
  await write('draft.md', post({ slug: 'segredo-editorial', status: 'draft', title: 'TEXTO PRIVADO' }));
  const posts = await loadPosts({ root, now: '2026-03-01' });
  assert.equal(posts.length, 1);
  assert.ok(!JSON.stringify(posts).includes('TEXTO PRIVADO'));
  assert.equal(posts[0].updatedAt, '2026-02-12');
  assert.equal(posts[0].cover.width, 1200);
  assert.match(posts[0].cover.srcset, /480w.*800w.*1200w/);
}));
test('Slug, aliases, datas, status, metadados e imagens falham antes de publicar', () => workspace(async (root, write) => {
  for (const override of [
    { slug: 'categoria' }, { slug: '../segredo' }, { status: 'publicado' },
    { publishedAt: '2026-02-30' }, { updatedAt: '2026-01-01' }, { updatedAt: '2027-01-01' },
    { cover: '/media/blog/a.svg' }, { category: 'desconhecida' }, { aliases: ['conta-por-km'] },
    { canonical: 'https://example.com/?secret=1' },
  ]) {
    await write('article.md', post(override));
    await assert.rejects(() => loadPosts({ root, now: '2026-03-01' }), JSON.stringify(override));
  }
  await write('article.md', post());
  await write('duplicate.md', post());
  await assert.rejects(() => loadPosts({ root, now: '2026-03-01' }), /duplicado/);
}));
test('Paginação e categorias são rotas reais enumeradas', () => {
  const paths = listingPaths(Array.from({length:25}, (_,i) => ({ slug: 'post-' + i, category: 'lucro-por-hora' })));
  assert.ok(paths.includes('blog/pagina/3'));
  assert.ok(paths.includes('blog/categoria/lucro-por-hora/pagina/3'));
});
test('Worker entrega 404, HEAD, 405, 301 e preserva rotas existentes', async () => {
  const calls = [];
  const handler = withBlogRouting({ fetch: async request => { calls.push(request.url); return new Response('original'); } }, { paths: ['blog'], slugs: ['artigo'], redirects: { antigo: 'artigo' } });
  const run = (path, method = 'GET') => handler.fetch(new Request('https://calcmot.com.br' + path, { method }), {}, {});
  for (const path of ['/blog/rascunho/','/blog/inexistente/','/blog/a/b','/blog/pagina/999/','/blog/categoria/invalida/']) {
    const response = await run(path);
    assert.equal(response.status,404,path); assert.equal(response.headers.get('X-Robots-Tag'),'noindex, follow');
  }
  assert.equal(await (await run('/blog/x/','HEAD')).text(), '');
  assert.equal((await run('/blog/','POST')).status,405);
  const redirect = await run('/blog/antigo/?utm_source=teste');
  assert.equal(redirect.status,301); assert.equal(redirect.headers.get('Location'),'https://calcmot.com.br/blog/artigo/?utm_source=teste');
  assert.equal(await (await run('/blog/artigo/')).text(),'original');
  assert.equal(await (await run('/ferramentas/corrida-vale-a-pena/')).text(),'original');
  assert.equal(calls.length,2);
});

test('Datas editoriais respeitam São Paulo na virada do dia UTC', () => {
  assert.equal(editorialToday(new Date('2026-10-30T01:00:00Z')), '2026-10-29');
  assert.equal(editorialToday(new Date('2026-10-30T03:00:00Z')), '2026-10-30');
});
