import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectHtml, verifyBacklink} from '../../scripts/growth/verify.mjs';
import {ingest, score, transition, STATES} from '../../scripts/growth/model.mjs';
import {publicAddress, validatePublicUrl} from '../../scripts/growth/network.mjs';
import {report, markdown} from '../../scripts/growth/report.mjs';
import {discoveryPlan} from '../../scripts/growth/discovery-plan.mjs';
const url = 'https://publisher.example/article';
const page = body => ({status: 200, body, url, headers: {'content-type': 'text/html'}});
test('HTML parser handles comments, scripts, entities, case and deceptive hosts', () => {
  const r = inspectHtml(`<!-- <a href="https://calcmot.com.br"> --><script>let a='<a href="https://calcmot.com.br">'</script><a href="https://calcmot.com.br.evil.test/">bad</a><a href="https://calcmot.com.br@evil.test">bad</a><A HREF="https://calcmot.com.br/&#63;x=1" REL="NoFollow sponsored">ok</A>`, url);
  assert.equal(r.links.length, 1); assert.equal(r.links[0].followed, false); assert.equal(r.links[0].url, 'https://calcmot.com.br/?x=1');
});
test('relative links honor base and metadata is conservative', () => {
  const r = inspectHtml('<base href="https://calcmot.com.br/"><a href="/">ok</a><meta name="robots" content="noindex,nofollow"><link rel="canonical" href="/original">', url);
  assert.equal(r.noindex, true); assert.equal(r.links[0].followed, false); assert.equal(r.canonical, 'https://calcmot.com.br/original'); assert.equal(r.indexation, null);
  assert.equal(inspectHtml('', url, {'x-robots-tag': 'googlebot: noindex'}).noindex, true);
});
for (const rel of ['nofollow','sponsored','ugc']) test(`rel ${rel} stays present without followed assertion`, () => {
  const r = inspectHtml(`<a href="https://www.calcmot.com.br" rel="${rel}">link</a>`, url);
  assert.equal(r.linkFound, true); assert.equal(r.links[0].followed, false);
});
test('loss requires successful absence or definitive 404; errors preserve last seen', async () => {
  const first = await verifyBacklink(url, {fetchPage: async () => page('<a href="https://calcmot.com.br">C</a>'), now: '2026-01-01'});
  const failure = await verifyBacklink(url, {fetchPage: async () => {throw Error('timeout');}, previous: first, now: '2026-01-02'});
  assert.equal(failure.lostAt, null); assert.equal(failure.lastSeen, first.lastSeen); assert.equal(failure.outcome, 'temporary_error');
  const missing = await verifyBacklink(url, {fetchPage: async () => page('<p>gone</p>'), previous: failure, now: '2026-01-03'});
  assert.equal(missing.lostAt, '2026-01-03'); assert.equal(missing.history.length, 3);
  const back = await verifyBacklink(url, {fetchPage: async () => page('<a href="https://calcmot.com.br">C</a>'), previous: missing, now: '2026-01-04'});
  assert.equal(back.lostAt, null); assert.equal(back.firstSeen, first.firstSeen);
  const gone = await verifyBacklink(url, {fetchPage: async () => ({...page(''), status: 404}), previous: back});
  assert.equal(gone.outcome, 'missing'); assert.ok(gone.lostAt);
});
test('403, 429, 503 and non HTML do not confirm loss', async () => {
  for (const status of [403,429,503]) assert.equal((await verifyBacklink(url, {fetchPage: async () => ({...page(''), status})})).outcome, 'temporary_error');
  assert.equal((await verifyBacklink(url, {fetchPage: async () => ({...page(''), headers: {'content-type':'application/json'}})})).outcome, 'temporary_error');
});
test('discovery deduplicates without overwriting existing evidence', () => {
  const original = {id:'one', name:'One', submitUrl:'https://example.com/?a=1'};
  assert.deepEqual(ingest([original], [{...original, id:'two', submitUrl:'https://example.com/?utm_source=x&a=1#top'}]), [original]);
  assert.throws(() => ingest([], [original]));
});
test('score only awards explicit sourced evidence', () => {
  assert.equal(score({priority:'A', cost:'free', notes:'great'}).points, 0);
  assert.equal(score({evidence:{relevance:{value:true, url, checkedAt:'2026-01-01', note:'Motorist coverage'}}}).points, 30);
});
test('nine tracker states require proof for publication', () => {
  assert.equal(STATES.length, 9);
  assert.throws(() => transition({}, 'published', {url, note:'claim'}));
  assert.equal(transition({publishedUrl:url}, 'published', {url,note:'checked'}).history.length, 1);
});
test('private, loopback, mapped, credentials, ports and DNS mixed answers blocked', async () => {
  for (const ip of ['127.0.0.1','10.1.2.3','169.254.169.254','100.64.0.1','::1','::ffff:127.0.0.1','fc00::1']) assert.equal(publicAddress(ip), false);
  assert.equal(publicAddress('8.8.8.8'), true);
  for (const u of ['http://127.0.0.1/','file:///etc/passwd','https://user:pass@example.com','https://example.com:444/']) await assert.rejects(validatePublicUrl(u));
  await assert.rejects(validatePublicUrl(url, async () => [{address:'8.8.8.8',family:4},{address:'127.0.0.1',family:4}]));
});
test('unavailable metrics are null and report uses actual newlines', () => {
  const r = report({targets:[]}); assert.equal(r.domainAuthority,null); assert.equal(r.referralTraffic,null); assert.ok(markdown(r).includes('\n\n')); assert.ok(!markdown(r).includes('\\n'));
});
test('submitted transition rejects absent evidence', () => {
  assert.throws(() => transition({}, 'submitted'));
  assert.throws(() => transition({}, 'submitted', {note:'sent'}));
});
test('execution ledger counts confirmation and awaiting review protocol independently of legacy stage', () => {
  const r = report({targets:[{id:'one',submissionStatus:'not_sent'}]}, {events:[{opportunityId:'one',status:'awaiting_review',submissionConfirmed:true,confirmationUrl:url,protocol:'123',evidence:'proof.jpg'}, {opportunityId:'two',status:'blocked_external',submissionConfirmed:false}]});
  assert.equal(r.execution.confirmedSubmissions,1); assert.equal(r.execution.awaitingReview[0].protocol,'123'); assert.equal(r.stages.awaiting_review,1); assert.equal(r.execution.blockedActions,1); assert.equal(r.verifiedLinks,0);
});
test('discovery results filter discarded and competitor records without inferring eligibility', () => {
  const r = ingest([], {date:'2026-10-29',results:[{title:'A',url,source:'search batch',classification:'candidato',verification:'free maybe'}, {title:'B',url:'https://competitor.test',classification:'concorrente'}, {title:'C',url:'https://discard.test',classification:'descartar'}]});
  assert.equal(r.length,1); assert.equal(r[0].eligibility,'unknown'); assert.equal(r[0].cost,'unknown'); assert.equal(r[0].discoveryEvidence.source,'search batch'); assert.equal(score(r[0]).points,0);
});
test('raw records are leads until explicit qualification; publication declarations do not prove backlinks', () => {
  const r = report({targets:[{id:'raw', stage:'discovered'}, {id:'claim', stage:'published', publishedUrl:url, verification:{outcome:'present'}}, {id:'qualified', qualification:{eligible:true,url,checkedAt:'2026-10-29',note:'Official rules reviewed'}}]});
  assert.equal(r.records,3); assert.equal(r.rawLeads,2); assert.equal(r.opportunities,1); assert.equal(r.declaredPublished,1); assert.equal(r.verifiedLinks,0); assert.deepEqual(r.unverifiedPublicationClaims,['claim']);
  assert.match(markdown(r), /Leads sem qualificação comprovada: 2/);
});
test('review protocol is optional and live confirmation is required; aliases and legacy stages remain accepted', () => {
  assert.equal(transition({}, 'awaiting_review', {url,note:'queued'}).stage,'awaiting_review');
  assert.equal(transition({}, 'awaiting_review', {url,note:'queued',protocol:'123'}).stage,'awaiting_review');
  assert.throws(() => transition({verification:{linkFound:true,outcome:'present'}}, 'link_confirmed', {url,note:'claim'}));
  const verification={linkFound:true,outcome:'present',httpStatus:200,referringDomain:'publisher.example',finalUrl:url,checkedAt:'2026-10-29'};
  assert.equal(transition({verification}, 'link_confirmed', {url,note:'checked'}).stage,'link_confirmed');
  assert.equal(report({targets:[{id:'live',verification}]}).stages.link_confirmed,1);
  for (const stage of ['approved','unavailable','lost','blocked_external']) assert.equal(transition({},stage,{url,note:'record'}).stage,stage);
  assert.equal(transition({},'eligible',{url,note:'record'}).stage,'qualified');
  assert.equal(transition({},'preparing',{url,note:'record'}).stage,'drafted');
});
test('confirmed forms without protocol and sent emails remain separate actions', () => {
  const r = report({targets:[]}, {events:[{id:'form',opportunityId:'form',submissionConfirmed:true,publishedUrl:url,evidence:'screenshot',protocol:null}, {id:'email',opportunityId:'email',submissionConfirmed:true,confirmationUrl:url,evidence:'sent.json',channel:'individual_email'}, {id:'unsupported',submissionConfirmed:true}]});
  assert.equal(r.execution.confirmedFormSubmissions,1); assert.equal(r.execution.sentEditorialProposals,1); assert.equal(r.execution.totalConfirmedActions,2);
});
test('candidates schema preserves source and optional domain dedupe preserves originals', () => {
  const original={id:'original',name:'Original',submitUrl:'https://www.example.com/submit'};
  const input={date:'2026-10-29',candidates:[{name:'same domain',url:'https://example.com/other',discovery_source:url,evidence:'source list'}, {name:'same URL',url:'https://www.example.com/submit',discovery_source:url}, {name:'new',url:'https://new.example/',discovery_source:url,evidence:'unverified list',category:'directory'}]};
  const result=ingest([original],input,{dedupeDomain:true});
  assert.equal(result.length,2); assert.deepEqual(result[0],original); assert.equal(result[1].name,'new'); assert.equal(result[1].eligibility,'unknown'); assert.equal(result[1].discoveryEvidence.url,url); assert.equal(result[1].stage,'discovered');
  assert.equal(ingest([original],input).length,3);
});
test('discovery plan is local search guidance with at least twelve specific queries', () => {
  const p=discoveryPlan(); assert.equal(p.mode,'plan_only'); assert.ok(p.queries.length>=12);
  assert.equal(new Set(p.queries.map(q=>q.category)).size,4); assert.ok(p.queries.every(q=>new URL(q.searchUrl).searchParams.get('q')===q.query));
});
