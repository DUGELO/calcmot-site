import {parse} from 'parse5';
export function inspectHtml(html, pageUrl, headers = {}) {
  const root = parse(html); const nodes = [];
  function visit(n) { nodes.push(n); for (const child of n.childNodes || []) visit(child); }
  visit(root);
  const attrs = n => Object.fromEntries((n.attrs || []).map(a => [a.name, a.value]));
  const resolve = (v, base) => {try {return new URL(v, base);} catch {return null;}};
  const baseNode = nodes.find(n => n.tagName === 'base' && attrs(n).href);
  const base = resolve(baseNode && attrs(baseNode).href, pageUrl)?.href || pageUrl;
  const directives = nodes.filter(n => n.tagName === 'meta' && /^(robots|googlebot)$/i.test(attrs(n).name || '')).map(n => attrs(n).content || '');
  directives.push(headers['x-robots-tag'] || '');
  const noindex = directives.some(s => /\b(noindex|none)\b/i.test(s));
  const pageNofollow = directives.some(s => /\b(nofollow|none)\b/i.test(s));
  const links = nodes.filter(n => n.tagName === 'a').flatMap(n => {
    const a = attrs(n); const u = resolve(a.href, base);
    if (!a.href || !u || !['https:', 'http:'].includes(u.protocol) || !['calcmot.com.br', 'www.calcmot.com.br'].includes(u.hostname)) return [];
    const rel = (a.rel || '').toLowerCase().split(/\s+/).filter(Boolean);
    return [{url: u.href, rel, followed: !pageNofollow && !rel.some(r => ['nofollow', 'sponsored', 'ugc'].includes(r))}];
  });
  const canonicalNode = nodes.find(n => n.tagName === 'link' && (attrs(n).rel || '').toLowerCase().split(/\s+/).includes('canonical'));
  return {linkFound: links.length > 0, links, noindex, pageNofollow, canonical: canonicalNode ? resolve(attrs(canonicalNode).href, base)?.href || null : null, indexation: null};
}
export async function verifyBacklink(url, {fetchPage, previous = null, now = new Date().toISOString()} = {}) {
  let result;
  try {
    const page = await fetchPage(url);
    const definitiveMissing = [404, 410].includes(page.status);
    if (page.status !== 200 && !definitiveMissing) throw Error(`HTTP ${page.status}`);
    if (page.status === 200 && !/text\/html|application\/xhtml\+xml/i.test(page.headers['content-type'] || '')) throw Error('Not HTML');
    const inspection = page.status === 200 ? inspectHtml(page.body, page.url, page.headers) : {linkFound: false, links: [], indexation: null};
    result = {...inspection, outcome: inspection.linkFound ? 'present' : 'missing', httpStatus: page.status, finalUrl: page.url, referringDomain: new URL(page.url).hostname, checkedAt: now, error: null};
    try { const robots = await fetchPage(new URL('/robots.txt', page.url).href); result.robots = {status: robots.status, requiresReview: robots.status !== 404, note: 'Crawl rules require user-agent/path review; do not prove indexation.'}; } catch {result.robots = {status: null, requiresReview: true, note: 'Unavailable; crawl permission unknown'};}
  } catch (error) {result = {outcome: 'temporary_error', linkFound: null, checkedAt: now, error: error.message, indexation: null};}
  const firstSeen = previous?.firstSeen || (result.linkFound ? now : null);
  const lastSeen = result.linkFound ? now : previous?.lastSeen || null;
  const lostAt = result.outcome === 'missing' && lastSeen ? previous?.lostAt || now : result.linkFound ? null : previous?.lostAt || null;
  return {...result, firstSeen, lastSeen, lostAt, history: [...(previous?.history || []), {at: now, outcome: result.outcome, httpStatus: result.httpStatus ?? null}]};
}
