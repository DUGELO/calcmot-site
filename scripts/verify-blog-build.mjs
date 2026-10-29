import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const output = resolve(process.argv[2] ?? 'dist/calcmot-site/browser');
const manifest = JSON.parse(readFileSync('src/app/blog/generated/sitemap.json', 'utf8'));
const routes = [...manifest.paths, ...manifest.posts.map(post => 'blog/' + post.slug)];
const sitemap = readFileSync(resolve(output, 'sitemap.xml'), 'utf8');
for (const path of routes) {
  const file = resolve(output, path, 'index.html');
  assert.ok(existsSync(file), 'Prerender ausente: ' + path);
  const html = readFileSync(file, 'utf8');
  assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1, 'H1 único: ' + path);
  assert.match(html, /<meta name="description" content="[^"]+"/);
  assert.match(html, /<meta name="robots" content="index,follow"/);
  const post = manifest.posts.find(post => path === 'blog/' + post.slug);
  assert.ok(html.includes('href="' + (post?.canonical ?? 'https://calcmot.com.br/' + path + '/') + '"'), 'Canonical: ' + path);
  if (post) {
    const blocks = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(match => JSON.parse(match[1]));
    const schema = blocks.find(block => block['@type'] === 'BlogPosting');
    assert.ok(schema, 'BlogPosting JSON válido ausente');
    for (const key of ['headline','description','image','datePublished','dateModified','author','publisher','mainEntityOfPage']) assert.ok(schema[key], 'Campo schema ausente: ' + key);
    assert.equal(schema.author['@type'], 'Person');
    assert.ok(blocks.some(block => block['@type'] === 'BreadcrumbList'), 'BreadcrumbList ausente');
    assert.match(html, /property="og:type" content="article"/);
    assert.match(html, /name="twitter:card" content="summary_large_image"/);
    assert.ok(html.includes('property="og:image"'), 'OG image ausente');
    assert.ok(html.includes('class="blog-prose"'), 'Corpo ausente');
    if (post.canonical === 'https://calcmot.com.br/' + path + '/') {
      assert.ok(sitemap.includes('<loc>' + post.canonical + '</loc>\n    <lastmod>' + post.updatedAt + '</lastmod>'), 'lastmod editorial ausente');
    }
  }
}
assert.ok(!sitemap.includes(':slug') && !sitemap.includes('/admin'), 'Rotas privadas/dinâmicas no sitemap');
console.log(`Blog HTML: ${routes.length} rotas, H1, canonical, robots, schema e datas OK.`);
