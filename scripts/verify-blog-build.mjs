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
    assert.match(html, /"@type":"BlogPosting"/);
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
