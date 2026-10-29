/** Public URLs from app.routes.ts plus the validated editorial manifest.
 * Production origin follows BRAND_TOKENS.site.url; build dates never become lastmod.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const tokens = readFileSync(resolve(root, 'src/app/core/constants/brand.tokens.ts'), 'utf8');
const routesSource = readFileSync(resolve(root, 'src/app/app.routes.ts'), 'utf8');
const siteUrl = (tokens.match(/url:\s*'([^']*)'/) ?? ['', ''])[1].replace(/\/+$/, '');
if (!siteUrl) throw new Error('Domínio de produção ausente em BRAND_TOKENS.site.url.');
const blog = JSON.parse(readFileSync(resolve(root, 'src/app/blog/generated/sitemap.json'), 'utf8'));
const staticPaths = [...new Set([...routesSource.matchAll(/path:\s*'([^']*)'/g)].map(match => match[1]))]
  .filter(path => path !== '**' && !path.includes(':') && path !== 'admin' && !path.startsWith('admin/') && path !== 'blog');
const escapeXml = value => value.replace(/[<>&"']/g, char => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&apos;' })[char]);
const records = staticPaths.map(path => ({ path }));
for (const path of blog.paths) {
  const category = path.match(/^blog\/categoria\/([^/]+)/)?.[1];
  const relevant = blog.posts.filter(post => !category || post.category === category);
  records.push({ path, lastmod: relevant.map(post => post.updatedAt).sort().at(-1) });
}
for (const post of blog.posts) {
  if (post.canonical === `${siteUrl}/blog/${post.slug}/`) records.push({ path: 'blog/' + post.slug, lastmod: post.updatedAt });
}
const urls = records.map(({ path, lastmod }) => `  <url>\n    <loc>${escapeXml(siteUrl + '/' + (path ? path + '/' : ''))}</loc>${lastmod ? '\n    <lastmod>' + lastmod + '</lastmod>' : ''}\n  </url>`).join('\n');
writeFileSync(resolve(root, 'public/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
console.log(`Sitemap: ${records.length} URLs públicas.`);
