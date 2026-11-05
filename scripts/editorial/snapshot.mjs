import { readFile, writeFile, readdir, mkdir, rm, lstat, realpath } from 'node:fs/promises';
import { resolve, relative, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { parseDocument, stringify } from 'yaml';
import { renderMarkdown, loadPosts, editorialToday } from '../blog/content.mjs';

export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
export const MANIFEST = '.release/manifest.json';
export function contentPath(path) {
  if (typeof path !== 'string' || !/^(?:articles\/[a-z0-9][a-z0-9-]{0,119}\.md|media\/[a-zA-Z0-9/_-]+\.(?:webp|avif|png|jpe?g))$/.test(path) || path.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Caminho editorial inválido.');
  return path;
}
export function parseArticle(raw) {
  const match = String(raw).match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error('O artigo não tem metadados válidos.');
  const doc = parseDocument(match[1], { uniqueKeys: true });
  if (doc.errors.length) throw new Error('Metadados YAML inválidos.');
  const data = doc.toJS({ maxAliasCount: 0 });
  if (!data || Array.isArray(data) || typeof data !== 'object') throw new Error('Metadados inválidos.');
  return { data, body: match[2] };
}
export function mediaReferences(data, body) {
  const html = renderMarkdown(body);
  const urls = [data.cover, ...[...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m => m[1])];
  return [...new Set(urls.map(url => {
    if (typeof url !== 'string' || !url.startsWith('/media/blog/')) throw new Error('Selecione uma capa e imagens da biblioteca editorial.');
    return contentPath('media/' + url.slice('/media/blog/'.length));
  }))].sort();
}
export async function safeRead(root, path) {
  contentPath(path);
  const base = await realpath(root), target = resolve(base, path);
  const resolved = await realpath(target);
  if (relative(base, resolved).startsWith('..') || (await lstat(target)).isSymbolicLink() || !(await lstat(target)).isFile()) throw new Error('Arquivo editorial inseguro.');
  // Reject symbolic links in parent directories as well.
  let parent = dirname(target);
  while (parent !== base) {
    if ((await lstat(parent)).isSymbolicLink()) throw new Error('Pasta editorial insegura.');
    const next = dirname(parent);
    if (next === parent) throw new Error('Arquivo fora da raiz editorial.');
    parent = next;
  }
  return readFile(target);
}
async function tree(root, folder) {
  let children;
  try { children = await readdir(resolve(root, folder), { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const files = [];
  for (const child of children) {
    const path = folder + '/' + child.name;
    if (child.isSymbolicLink()) throw new Error('Links simbólicos não são conteúdo editorial.');
    if (child.isDirectory()) files.push(...await tree(root, path));
    else { contentPath(path); files.push(path); }
  }
  return files;
}
export async function emptySnapshot(root) {
  await mkdir(resolve(root, '.release'), { recursive: true });
  const manifest = { schema: 1, kind: 'published', releaseId: 'bootstrap', codeRevision: null, entries: {}, files: [], snapshotDigest: digest('[]') };
  await writeFile(resolve(root, MANIFEST), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}
export async function verifySnapshot(root) {
  const manifest = JSON.parse(await readFile(resolve(root, MANIFEST), 'utf8'));
  if (manifest.schema !== 1 || manifest.kind !== 'published' || !Array.isArray(manifest.files) || !manifest.entries || typeof manifest.entries !== 'object') throw new Error('Snapshot publicado inválido.');
  if (manifest.releaseId !== 'bootstrap' && (!/^[a-zA-Z0-9-]{1,80}$/.test(manifest.releaseId) || !/^[a-f0-9]{40}$/.test(manifest.codeRevision ?? ''))) throw new Error('Revisão de publicação inválida.');
  const listed = new Set();
  for (const file of manifest.files) {
    contentPath(file.path);
    if (listed.has(file.path) || !/^[a-f0-9]{64}$/.test(file.sha256)) throw new Error('Manifesto de arquivos inválido.');
    listed.add(file.path);
    if (digest(await safeRead(root, file.path)) !== file.sha256) throw new Error('O snapshot foi alterado após a aprovação.');
  }
  const actual = [...await tree(root, 'articles'), ...await tree(root, 'media')].sort();
  if (JSON.stringify(actual) !== JSON.stringify([...listed].sort()) || digest(JSON.stringify(manifest.files)) !== manifest.snapshotDigest) throw new Error('Arquivos extras ou ausentes no snapshot.');
  const media = new Set();
  for (const [path, entry] of Object.entries(manifest.entries)) {
    if (!contentPath(path).startsWith('articles/') || !/^[a-f0-9]{40}$/.test(entry.sourceRevision ?? '') || !/^[a-f0-9]{40}$/.test(entry.sourceBlob ?? '')) throw new Error('Registro editorial inválido.');
    if (!entry.withdrawn && !listed.has(path)) throw new Error('Artigo aprovado ausente.');
  }
  for (const path of actual.filter(path => path.startsWith('articles/'))) {
    const { data, body } = parseArticle(await safeRead(root, path));
    if (data.status !== 'published' || !Object.hasOwn(manifest.entries, path) || manifest.entries[path].withdrawn) throw new Error('Rascunho ou artigo sem aprovação no snapshot.');
    mediaReferences(data, body).forEach(path => media.add(path));
  }
  if (JSON.stringify([...media].sort()) !== JSON.stringify(actual.filter(path => path.startsWith('media/')))) throw new Error('O snapshot contém mídia sem uso ou mídia ausente.');
  return manifest;
}
const summaryFrom = body => body.split(/\n\s*\n/).find(block => block.trim() && !/^(?:#|!\[|\||>|\x60)/.test(block.trim()))?.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_~\x60]/g, '').replace(/\s+/g, ' ').trim().slice(0, 155) ?? '';
export async function updateSnapshot({ root, path, raw, sourceRevision, sourceBlob, readMedia, operation = 'publish', day = editorialToday() }) {
  contentPath(path);
  if (!path.startsWith('articles/') || !/^[a-f0-9]{40}$/.test(sourceRevision) || !/^[a-f0-9]{40}$/.test(sourceBlob)) throw new Error('Solicitação editorial inválida.');
  const previous = await verifySnapshot(root);
  const old = previous.entries[path];
  let entry;
  if (operation === 'withdraw') {
    if (!old || old.withdrawn) return { changed: false, manifest: previous };
    await rm(resolve(root, path));
    entry = { ...old, withdrawn: true, sourceRevision, sourceBlob };
  } else {
    if (operation !== 'publish') throw new Error('Operação inválida.');
    const parsed = parseArticle(raw);
    const data = parsed.data;
    let body = parsed.body;
    const advanced = data.advanced ?? {};
    const slug = advanced.slug || data.slug || old?.slug || path.slice(9, -3);
    const mediaPaths = mediaReferences(data, body);
    const mediaHashes = [];
    for (const mediaPath of mediaPaths) {
      const bytes = await readMedia(mediaPath);
      if (!Buffer.isBuffer(bytes) || bytes.length > 8 * 1024 * 1024) throw new Error('Imagem inválida ou maior que 8 MB.');
      const hash = digest(bytes);
      const approvedPath = 'media/approved-' + hash + '.' + mediaPath.split('.').at(-1);
      const sourceUrl = '/media/blog/' + mediaPath.slice(6);
      const approvedUrl = '/media/blog/' + approvedPath.slice(6);
      if (data.cover === sourceUrl) data.cover = approvedUrl;
      body = body.replaceAll(sourceUrl, approvedUrl);
      mediaHashes.push([approvedPath, hash]);
      await mkdir(dirname(resolve(root, approvedPath)), { recursive: true });
      await writeFile(resolve(root, approvedPath), bytes);
    }
    const metadata = {
      title: data.title, slug, summary: data.summary?.trim() || summaryFrom(body), category: data.category,
      author: advanced.author || data.author || 'CalcMot', cover: data.cover,
      coverAlt: advanced.coverAlt || data.coverAlt || data.title,
      seoTitle: advanced.seoTitle || data.seoTitle || data.title,
      seoDescription: advanced.seoDescription || data.seoDescription || data.summary?.trim() || summaryFrom(body),
      canonical: advanced.canonical || data.canonical || '',
      aliases: [...new Set([...(old?.aliases ?? []), ...(advanced.aliases ?? data.aliases ?? []), ...(old?.slug && old.slug !== slug ? [old.slug] : [])])],
    };
    const semanticDigest = digest(JSON.stringify({ metadata, body: body.trim(), mediaHashes }));
    if (old && !old.withdrawn && old.semanticDigest === semanticDigest) {
      const metadataChanged = old.sourceRevision !== sourceRevision || old.sourceBlob !== sourceBlob;
      const manifest = metadataChanged ? {
        ...previous, entries: { ...previous.entries, [path]: { ...old, sourceRevision, sourceBlob } },
      } : previous;
      return { changed: false, metadataChanged, manifest };
    }
    metadata.status = 'published';
    metadata.publishedAt = old?.publishedAt || day;
    metadata.updatedAt = day;
    await mkdir(dirname(resolve(root, path)), { recursive: true });
    await writeFile(resolve(root, path), '---\n' + stringify(metadata) + '---\n' + body.trim() + '\n');
    entry = { slug, aliases: metadata.aliases, sourceRevision, sourceBlob, publishedAt: metadata.publishedAt, updatedAt: day, semanticDigest, withdrawn: false };
  }
  const entries = { ...previous.entries, [path]: entry };
  const usedMedia = new Set();
  for (const articlePath of await tree(root, 'articles')) {
    const { data, body } = parseArticle(await safeRead(root, articlePath));
    mediaReferences(data, body).forEach(path => usedMedia.add(path));
  }
  for (const mediaPath of await tree(root, 'media')) if (!usedMedia.has(mediaPath)) await rm(resolve(root, mediaPath));
  return { changed: true, manifest: { ...previous, entries } };
}
export async function sealSnapshot({ root, manifest, releaseId, codeRevision }) {
  if (!/^[a-zA-Z0-9-]{1,80}$/.test(releaseId) || !/^[a-f0-9]{40}$/.test(codeRevision)) throw new Error('Identificação da publicação inválida.');
  const paths = [...await tree(root, 'articles'), ...await tree(root, 'media')].sort();
  const files = [];
  for (const path of paths) files.push({ path, sha256: digest(await safeRead(root, path)) });
  const result = { ...manifest, releaseId, codeRevision, files, snapshotDigest: digest(JSON.stringify(files)) };
  await mkdir(resolve(root, '.release'), { recursive: true });
  await writeFile(resolve(root, MANIFEST), JSON.stringify(result, null, 2) + '\n');
  await verifySnapshot(root);
  // Reuse the existing renderer, media decoder and SEO/slug checks.
  await loadPosts({ root, directory: resolve(root, 'articles'), mediaDirectory: resolve(root, 'media'), imageOutput: resolve(root, '.release/validated-images') });
  return result;
}
