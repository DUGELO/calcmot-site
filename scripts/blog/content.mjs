import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { parseDocument } from 'yaml';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import sharp from 'sharp';

export const SITE = 'https://calcmot.com.br';
export const PAGE_SIZE = 12;
export const CATEGORIES = {
  'lucro-por-quilometro': 'Lucro por quilômetro',
  'lucro-por-hora': 'Lucro por hora',
  'custos-operacionais': 'Custos operacionais',
  'combustivel-e-manutencao': 'Combustível e manutenção',
  'uber-versus-99': 'Uber versus 99',
  'gestao-financeira': 'Gestão financeira',
  'imposto-de-renda': 'Imposto de Renda',
  'rentabilidade-de-corridas': 'Rentabilidade de corridas',
};
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const reserved = new Set(['pagina', 'categoria']);
const md = new MarkdownIt({ html: false, linkify: false, typographer: false });
const fail = message => { throw new Error(message); };
const text = (value, label, max = 300) => {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[<>\u0000-\u001f]/.test(value))
    fail(`Campo inválido: ${label}`);
  return value.trim();
};
const date = (value, label) => {
  const result = text(value, label, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || new Date(result + 'T12:00:00Z').toISOString().slice(0, 10) !== result)
    fail(`Data inválida: ${label}`);
  return result;
};
export function safeLink(href) {
  if (typeof href !== 'string' || /[\s\\\u0000-\u001f]/.test(href)) return false;
  if (/^\/(?!\/)/.test(href) || /^#[a-z0-9-]+$/.test(href)) return true;
  try {
    const url = new URL(href);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch { return false; }
}
export function canonical(value, slug) {
  if (!value) return `${SITE}/blog/${slug}/`;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash)
    fail('Canonical deve ser HTTPS absoluto, sem query, fragmento ou credenciais.');
  return url.href;
}
export function renderMarkdown(body) {
  if (typeof body !== 'string' || !body.trim() || body.length > 200_000) fail('Conteúdo vazio ou maior que 200 KB.');
  const tokens = md.parse(body, {});
  let previousHeading = 1;
  function inspect(items) {
    for (const token of items) {
      if (token.type === 'heading_open') {
        const level = Number(token.tag.slice(1));
        if (level === 1 || level > previousHeading + 1) fail('Use títulos H2–H6 sem saltar níveis; o H1 vem do título.');
        previousHeading = level;
      }
      if (token.type === 'link_open' && !safeLink(token.attrGet('href'))) fail('Link inseguro no Markdown.');
      if (token.type === 'image' && !/^\/media\/blog\/[a-zA-Z0-9/_-]+\.(?:webp|avif|png|jpe?g)$/.test(token.attrGet('src') ?? ''))
        fail('Imagens do conteúdo devem usar /media/blog/ e formato raster.');
      if (token.children) inspect(token.children);
    }
  }
  inspect(tokens);
  // A segunda barreira remove qualquer atributo/tag fora da lista permitida.
  return sanitizeHtml(md.renderer.render(tokens, md.options, {}), {
    allowedTags: ['p','h2','h3','h4','h5','h6','a','strong','em','s','ul','ol','li','blockquote','pre','code','hr','br','img','table','thead','tbody','tr','th','td'],
    allowedAttributes: { a: ['href','title','rel'], img: ['src','alt','title','loading','decoding'], ol: ['start'], th: ['align'], td: ['align'] },
    allowedSchemes: ['https'],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attrs) => ({ tagName, attribs: { ...attrs, rel: 'noopener noreferrer' } }),
      img: (tagName, attrs) => ({ tagName, attribs: { ...attrs, loading: 'lazy', decoding: 'async' } }),
    },
  });
}
async function image(source, root, output) {
  if (!/^\/media\/blog\/[a-zA-Z0-9/_-]+\.(?:webp|avif|png|jpe?g)$/.test(source ?? '')) fail('Capa deve ser uma imagem raster em /media/blog/.');
  const path = resolve(root, 'public', source.slice(1));
  if (relative(resolve(root, 'public/media/blog'), path).startsWith('..')) fail('Imagem fora da pasta editorial.');
  const input = await readFile(path);
  if (input.length > 8 * 1024 * 1024) fail('Imagem maior que 8 MB.');
  const meta = await sharp(input, { limitInputPixels: 40_000_000 }).metadata();
  if (!['jpeg','png','webp','avif','heif'].includes(meta.format) || (meta.pages ?? 1) > 1) fail('Formato de imagem inválido ou animado.');
  const key = createHash('sha256').update(input).digest('hex').slice(0, 20);
  const variants = [];
  await mkdir(output, { recursive: true });
  for (const width of [480, 800, 1200]) {
    const result = await sharp(input).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
    const name = `${key}-${width}.webp`;
    await writeFile(resolve(output, name), result.data);
    variants.push({ src: `/media/blog-optimized/${name}`, width: result.info.width, height: result.info.height });
  }
  return { ...variants[2], srcset: [...new Map(variants.map(v => [v.width, `${v.src} ${v.width}w`])).values()].join(', ') };
}
export async function loadPosts({ root, directory = resolve(root, 'content/blog'), now = new Date().toISOString().slice(0, 10), imageOutput = resolve(root, 'public/media/blog-optimized') }) {
  const posts = [], slugs = new Set(), files = (await readdir(directory)).filter(name => name.endsWith('.md')).sort();
  for (const file of files) {
    const source = await readFile(resolve(directory, file), 'utf8');
    const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) fail(`${file}: frontmatter YAML ausente.`);
    const doc = parseDocument(match[1], { uniqueKeys: true });
    if (doc.errors.length) fail(`${file}: YAML inválido: ${doc.errors[0].message}`);
    const data = doc.toJS({ maxAliasCount: 0 });
    if (!data || Array.isArray(data) || typeof data !== 'object') fail(`${file}: metadados inválidos.`);
    // Rascunhos podem estar incompletos, mas nunca entram no catálogo público.
    if (!['draft','published'].includes(data.status)) fail(`${file}: status deve ser draft ou published.`);
    if (data.slug) {
      if (!slugPattern.test(data.slug) || reserved.has(data.slug) || slugs.has(data.slug)) fail(`${file}: slug inválido, reservado ou duplicado.`);
      slugs.add(data.slug);
    }
    if (data.status === 'draft') continue;
    const slug = text(data.slug, 'slug', 100);
    const publishedAt = date(data.publishedAt, 'publicação');
    const updatedAt = data.updatedAt ? date(data.updatedAt, 'atualização') : publishedAt;
    if (updatedAt < publishedAt || updatedAt > now) fail(`${file}: atualização anterior à publicação ou no futuro.`);
    if (publishedAt > now) fail(`${file}: publicação futura requer novo build na data; use rascunho até lá.`);
    if (!Object.hasOwn(CATEGORIES, data.category)) fail(`${file}: categoria inválida.`);
    const aliases = data.aliases ?? [];
    if (!Array.isArray(aliases) || aliases.some(alias => typeof alias !== 'string' || !slugPattern.test(alias) || reserved.has(alias))) fail(`${file}: slugs anteriores inválidos.`);
    const html = renderMarkdown(match[2]);
    // Toda imagem incorporada também é decodificada e otimizada, sem fetch remoto.
    let safeHtml = html;
    for (const source of new Set([...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m => m[1]))) {
      const optimized = await image(source, root, imageOutput);
      safeHtml = safeHtml.replaceAll(`src="${source}"`, `src="${optimized.src}" width="${optimized.width}" height="${optimized.height}"`);
    }
    posts.push({
      slug, title: text(data.title, 'título', 120), summary: text(data.summary, 'resumo', 300),
      category: data.category, categoryLabel: CATEGORIES[data.category],
      author: text(data.author, 'autor', 100), publishedAt, updatedAt,
      cover: await image(data.cover, root, imageOutput), coverAlt: text(data.coverAlt, 'texto alternativo', 200),
      seoTitle: text(data.seoTitle || data.title, 'título SEO', 120),
      seoDescription: text(data.seoDescription || data.summary, 'descrição SEO', 300),
      canonical: canonical(data.canonical, slug), aliases,
      html: safeHtml, readingMinutes: Math.max(1, Math.ceil(match[2].split(/\s+/).length / 200)),
    });
  }
  const aliases = new Set();
  for (const post of posts) for (const alias of post.aliases) {
    if (slugs.has(alias) || aliases.has(alias)) fail(`Redirect em conflito: ${alias}`);
    aliases.add(alias);
  }
  const titles = new Set(), descriptions = new Set();
  for (const post of posts) {
    if (titles.has(post.seoTitle) || descriptions.has(post.seoDescription)) fail('Títulos e descrições SEO precisam ser únicos.');
    titles.add(post.seoTitle); descriptions.add(post.seoDescription);
  }
  return posts.sort((a,b) => b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug));
}
export function listingPaths(posts) {
  const paths = ['blog'];
  for (let page = 2; page <= Math.ceil(posts.length / PAGE_SIZE); page++) paths.push(`blog/pagina/${page}`);
  for (const category of Object.keys(CATEGORIES).filter(key => posts.some(p => p.category === key))) {
    const pages = Math.ceil(posts.filter(p => p.category === category).length / PAGE_SIZE);
    paths.push(`blog/categoria/${category}`);
    for (let page = 2; page <= pages; page++) paths.push(`blog/categoria/${category}/pagina/${page}`);
  }
  return paths;
}
