import {registrableDomain, hostname} from './domains.mjs';
import {STATES, LEGACY_STATES, score, liveVerification, normalizeStage, normalizeUrl} from './model.mjs';
export function report(data, ledger = {events: []}) {
  const targets = data.targets;
  const external = targets.filter(t => liveVerification(t.verification) && hostname(t.verification.finalUrl) && registrableDomain(t.verification.finalUrl) !== 'calcmot.com.br');
  const live = [...new Map(external.map(t => [normalizeUrl(t.verification.finalUrl), t])).values()];
  const current = live.filter(t => t.lastAttempt
    ? t.lastAttempt.outcome === 'present' && t.lastAttempt.checkedAt?.slice(0,10) === new Date().toISOString().slice(0,10) && Date.parse(t.lastAttempt.checkedAt) >= Date.parse(t.verification.checkedAt)
    : t.verification.checkedAt.slice(0,10) === new Date().toISOString().slice(0,10));
  const domains = values => new Set(values.map(t => registrableDomain(t.verification.finalUrl)).filter(Boolean)).size;
  const qualified = targets.filter(t => t.qualification?.eligible === true && t.qualification.url && t.qualification.checkedAt && t.qualification.note);
  const declaredPublished = targets.filter(t => t.stage === 'published' || t.submissionStatus === 'published');
  const events = ledger.events || [];
  const confirmed = events.filter(e => e.submissionConfirmed === true && (e.confirmationUrl || e.publishedUrl || e.source) && e.evidence);
  return {generatedAt: new Date().toISOString(), records: targets.length, rawLeads: targets.length - qualified.length, opportunities: qualified.length,
    declaredPublished: declaredPublished.length, unverifiedPublicationClaims: declaredPublished.filter(t => !live.includes(t)).map(t => t.id),
    execution: {recordedEvents: events.length, confirmedSubmissions: new Set(confirmed.map(e => e.opportunityId)).size,
      confirmedFormSubmissions: confirmed.filter(e => e.channel !== 'individual_email').length,
      sentEditorialProposals: confirmed.filter(e => e.channel === 'individual_email').length,
      totalConfirmedActions: confirmed.length,
      awaitingReview: confirmed.filter(e => e.status === 'awaiting_review').map(e => ({opportunityId: e.opportunityId, protocol: e.protocol ?? null, confirmationUrl: e.confirmationUrl})),
      blockedActions: events.filter(e => e.status === 'blocked_external').length, acquisitionCostBRL: ledger.acquisitionCostBRL ?? null},
    stages: Object.fromEntries([...STATES, ...LEGACY_STATES].map(s => [s, targets.filter(t => {
      const recorded = confirmed.some(e => e.opportunityId === t.id);
      const stage = normalizeStage(t.stage || (t.submissionStatus === 'not_sent' ? 'discovered' : t.submissionStatus));
      const event = events.filter(e => e.opportunityId === t.id).at(-1);
      const projected = live.includes(t) ? 'link_confirmed' : event?.status === 'blocked_external' ? 'blocked_external' : recorded && event?.status === 'published' ? 'published' : recorded && event?.status === 'awaiting_review' ? 'awaiting_review' : recorded && ['discovered','qualified','drafted','approved'].includes(stage) ? 'submitted' : stage;
      return projected === s;
    }).length])),
    verifiedLinks: live.length, lastKnownVerifiedLinks: live.length, referringDomains: domains(live),
    currentVerifiedLinks: current.length, currentReferringDomains: domains(current),
    unknownCurrentLinks: live.length - current.length,
    unknownRegistrableDomains: [...new Set(live.filter(t => !registrableDomain(t.verification.finalUrl)).map(t => hostname(t.verification.finalUrl)))],
    pageIndexingSignals: {blockedByMetaOrHeader: live.filter(t => t.verification.noindex === true).length, noBlockInMetaOrHeader: live.filter(t => t.verification.noindex === false).length, unknown: live.filter(t => typeof t.verification.noindex !== 'boolean').length},
    actualIndexation: null,
    lostLinks: targets.filter(t => t.verification?.lostAt).length,
    referralTraffic: null, organicClicks: null, domainAuthority: null, domainRating: null,
    ranked: targets.map(t => ({id: t.id, name: t.name, executionEvents: events.filter(e => e.opportunityId === t.id), ...score(t)})).sort((a,b) => b.points-a.points)};
}
export function markdown(r) {
  return ['# CalcMot Growth Engine', '', `Gerado: ${r.generatedAt}`, '', `Registros no inventário: ${r.records}`, `Leads sem qualificação comprovada: ${r.rawLeads}`, `Oportunidades qualificadas com evidência: ${r.opportunities}`, `Publicações declaradas: ${r.declaredPublished}`, `Declarações sem backlink confirmado: ${r.unverifiedPublicationClaims.length}`, `Ações confirmadas no ledger: ${r.execution.totalConfirmedActions}`, `Formulários confirmados: ${r.execution.confirmedFormSubmissions}`, `Propostas editoriais enviadas por email: ${r.execution.sentEditorialProposals}`, `Ações bloqueadas: ${r.execution.blockedActions}`, ...r.execution.awaitingReview.map(e => `Aguardando revisão: ${e.opportunityId}; protocolo ${e.protocol ?? '—'}; ${e.confirmationUrl}`), `Links com última comprovação preservada (histórico): ${r.verifiedLinks}`, `Domínios registráveis da última comprovação: ${r.referringDomains}`, `Links reconfirmados na data/última tentativa: ${r.currentVerifiedLinks}`, `Domínios registráveis reconfirmados: ${r.currentReferringDomains}`, `Links históricos sem confirmação atual: ${r.unknownCurrentLinks}`, `Links perdidos confirmados: ${r.lostLinks}`, '', 'Estágios combinam inventário e submissões comprovadas no ledger; awaiting_review indica fila; published é declaração e link_confirmed exige verificação HTTP.', ...Object.entries(r.stages).map(([s,n]) => `- ${s}: ${n}`), '', 'Tráfego GA4, cliques Search Console, DA e DR: não disponíveis (null).', 'Presença HTML não comprova indexação nem tráfego. Erros temporários não confirmam perda.', '', '## Priorização por evidência', '', ...r.ranked.map(t => `- ${t.id}: ${t.points}/100; critérios sem evidência: ${t.unknown.join(', ') || 'nenhum'}`), ''].join('\n');
}
