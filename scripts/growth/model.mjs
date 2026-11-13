export const STATES = Object.freeze(['discovered', 'qualified', 'drafted', 'submitted', 'awaiting_review', 'published', 'link_confirmed', 'rejected', 'blocked_external']);
export const LEGACY_STATES = Object.freeze(['approved', 'unavailable', 'lost']);
export const normalizeStage = stage => ({eligible:'qualified', preparing:'drafted'}[stage] || stage);
export function liveVerification(v) {
  return !!(v?.outcome === 'present' && v.linkFound === true && v.httpStatus === 200 && v.referringDomain && v.finalUrl && Number.isFinite(Date.parse(v.checkedAt)));
}
export function normalizeUrl(value) {
  const u = new URL(value);
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) throw Error('Invalid public URL');
  u.hash = ''; u.hostname = u.hostname.toLowerCase();
  for (const key of [...u.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$)/i.test(key)) u.searchParams.delete(key);
  u.searchParams.sort(); return u.href.replace(/\/$/, '');
}
export function ingest(existing, candidates, {dedupeDomain = false} = {}) {
  const discoveredAt = candidates.date;
  if (!Array.isArray(candidates)) candidates = candidates.results || candidates.candidates;
  if (!Array.isArray(candidates)) throw Error('Candidates must be array or discovery.results');
  const result = structuredClone(existing); const ids = new Set(result.map(t => t.id));
  const urls = new Set(result.map(t => normalizeUrl(t.submitUrl)));
  const domain = value => new URL(value).hostname.replace(/^www\./, '');
  const domains = new Set(result.map(t => domain(t.submitUrl)));
  for (const candidate of candidates) {
    if (/concorr|competitor|descart|discard|exclu/i.test(`${candidate.classification || ''} ${candidate.status || ''}`) || candidate.competitor === true || candidate.discarded === true) continue;
    const t = candidate.submitUrl ? candidate : {
      id: `discovery-${new URL(candidate.url).hostname.replace(/[^a-z0-9]+/g, '-')}-${Buffer.from(normalizeUrl(candidate.url)).toString('base64url')}`,
      name: candidate.title || candidate.name, submitUrl: candidate.url, eligibility: 'unknown', cost: 'unknown',
      discoveryEvidence: {url: candidate.discovery_source || candidate.url, candidateUrl: candidate.url, source: candidate.discovery_source || candidate.source, checkedAt: discoveredAt, category: candidate.category || null, queries: candidate.search_queries || [], note: candidate.verification || candidate.evidence || 'Unverified discovery'},
      notes: 'Discovery candidate; rules, eligibility and backlink require manual confirmation'
    };
    const url = normalizeUrl(t.submitUrl);
    if (ids.has(t.id) || urls.has(url) || (dedupeDomain && domains.has(domain(url)))) continue;
    if (!t.id || !t.name || !t.discoveryEvidence?.url || !t.discoveryEvidence?.checkedAt) throw Error('Discovery requires identity and source evidence');
    normalizeUrl(t.discoveryEvidence.url);
    result.push({...t, eligibility: 'unknown', cost: 'unknown', submissionStatus: 'not_sent', stage: 'discovered', publishedUrl: null}); ids.add(t.id); urls.add(url); domains.add(domain(url));
  }
  return result;
}
export function score(target) {
  const weights = {relevance: 30, audience: 25, editorial: 25, free: 10, lowEffort: 10};
  const evidence = []; let points = 0;
  for (const [criterion, weight] of Object.entries(weights)) {
    const item = target.evidence?.[criterion];
    if (item?.value === true && item.url && item.checkedAt && item.note) {
      normalizeUrl(item.url);
      if (!Number.isFinite(Date.parse(item.checkedAt))) throw Error('Invalid evidence date');
      points += weight; evidence.push({criterion, weight, ...item});
    }
  }
  return {points, max: 100, evidence, unknown: Object.keys(weights).filter(k => !evidence.some(e => e.criterion === k))};
}
export function transition(target, stage, evidence, now = new Date().toISOString()) {
  stage = normalizeStage(stage);
  if (![...STATES, ...LEGACY_STATES].includes(stage)) throw Error('Invalid tracker stage');
  if (!evidence?.note || !evidence?.url) throw Error('Transition requires source and note');
  normalizeUrl(evidence.url);
  if (stage === 'published' && !target.publishedUrl) throw Error('Published requires declared publication URL');
  if (stage === 'link_confirmed' && !liveVerification(target.verification)) throw Error('Link confirmation requires dated HTTP200 backlink verification');
  return {...target, stage, history: [...(target.history || []), {from: target.stage || 'discovered', to: stage, at: now, evidence}]};
}
