import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'dist/calcmot-site/browser');
const read = (path) => readFileSync(resolve(output, path), 'utf8');
const routes = ['', 'como-funciona', 'calculadora-ganhos-motorista-app', 'ferramentas/corrida-vale-a-pena', 'privacidade', 'suporte'];
const failures = [];

for (const route of routes) {
  const path = route ? `${route}/index.html` : 'index.html';
  if (!existsSync(resolve(output, path))) {
    failures.push(`HTML prerender ausente: ${path}`);
    continue;
  }
  const html = read(path);
  const url = `https://calcmot.com.br/${route ? `${route}/` : ''}`;
  if (!/<h1\b/i.test(html)) failures.push(`H1 ausente: ${path}`);
  if (!/<title>[^<]+<\/title>/i.test(html)) failures.push(`title ausente: ${path}`);
  if (!/<meta[^>]+name="description"/i.test(html)) failures.push(`description ausente: ${path}`);
  if (!html.includes(url)) failures.push(`URL canônica ausente: ${path}`);
  if (!html.includes('https://play.google.com/store/apps/details?id=br.com.calcmot')) {
    failures.push(`URL Play Store ausente: ${path}`);
  }
}

const calculatorHtml = resolve(output, 'ferramentas/corrida-vale-a-pena/index.html');
const realOffer = resolve(output, 'assets/screenshots/offer-real-q90.webp');
if (!existsSync(realOffer)) failures.push('WebP de oferta real ausente no build');
if (existsSync(calculatorHtml)) {
  const html = read('ferramentas/corrida-vale-a-pena/index.html');
  if (!html.includes('/assets/screenshots/offer-real-q90.webp')) {
    failures.push('Imagem de oferta real não referenciada na página prerenderizada');
  }
  if (!html.includes('width="440"') || !html.includes('height="355"')) {
    failures.push('Dimensões intrínsecas da imagem de oferta real ausentes');
  }
}

if (!existsSync(resolve(output, 'sitemap.xml'))) {
  failures.push('Sitemap ausente no build');
} else {
  const sitemap = read('sitemap.xml');
  for (const route of routes) {
    const url = `https://calcmot.com.br/${route ? `${route}/` : ''}`;
    if (!sitemap.includes(`<loc>${url}</loc>`)) failures.push(`Rota ausente no sitemap: ${url}`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Prerender OK: HTML público, H1, metadata, Play Store e sitemap.');
}
