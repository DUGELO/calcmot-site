/**
 * Gera public/sitemap.xml a partir das rotas reais do app.
 *
 * O sitemap exige URLs absolutas. Enquanto BRAND_TOKENS.site.url estiver vazio
 * (domínio de produção não confirmado), o script não escreve nada e avisa.
 * Preencha o domínio e rode `npm run seo:sitemap` para publicar o sitemap.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const tokens = readFileSync(resolve(root, 'src/app/core/constants/brand.tokens.ts'), 'utf8');
const routesSource = readFileSync(resolve(root, 'src/app/app.routes.ts'), 'utf8');

const siteUrl = (tokens.match(/url:\s*'([^']*)'/) ?? ['', ''])[1].replace(/\/+$/, '');
const paths = [...new Set([...routesSource.matchAll(/path:\s*'([^']*)'/g)].map((match) => match[1]))]
  .filter((path) => path !== '**');

if (!siteUrl) {
  console.warn(
    'Sitemap não gerado: BRAND_TOKENS.site.url está vazio. Defina o domínio de produção e rode novamente.',
  );
  process.exit(0);
}

const today = new Date().toISOString().slice(0, 10);
const urls = paths
  .map((path) => `  <url>\n    <loc>${siteUrl}/${path}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`)
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

writeFileSync(resolve(root, 'public/sitemap.xml'), sitemap, 'utf8');
console.log(`public/sitemap.xml gerado com ${paths.length} rotas para ${siteUrl}.`);
