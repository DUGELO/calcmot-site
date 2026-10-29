import {STATES, LEGACY_STATES, score, liveVerification, normalizeStage} from './model.mjs';
export function report(data, ledger = {events: []}) {
  const targets = data.targets;
  const live = targets.filter(t => liveVerification(t.verification));
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
    verifiedLinks: live.length, referringDomains: new Set(live.map(t => t.verification.referringDomain)).size,
    lostLinks: targets.filter(t => t.verification?.lostAt).length,
    referralTraffic: null, organicClicks: null, domainAuthority: null, domainRating: null,
    ranked: targets.map(t => ({id: t.id, name: t.name, executionEvents: events.filter(e => e.opportunityId === t.id), ...score(t)})).sort((a,b) => b.points-a.points)};
}
export function markdown(r) {
  return ['# CalcMot Growth Engine', '', `Gerado: ${r.generatedAt}`, '', `Registros no inventário: ${r.records}`, `Leads sem qualificação comprovada: ${r.rawLeads}`, `Oportunidades qualificadas com evidência: ${r.opportunities}`, `Publicações declaradas: ${r.declaredPublished}`, `Declarações sem backlink confirmado: ${r.unverifiedPublicationClaims.length}`, `Ações confirmadas no ledger: ${r.execution.totalConfirmedActions}`, `Formulários confirmados: ${r.execution.confirmedFormSubmissions}`, `Propostas editoriais enviadas por email: ${r.execution.sentEditorialProposals}`, `Ações bloqueadas: ${r.execution.blockedActions}`, ...r.execution.awaitingReview.map(e => `Aguardando revisão: ${e.opportunityId}; protocolo ${e.protocol ?? '—'}; ${e.confirmationUrl}`), `Links verificados nesta coleta: ${r.verifiedLinks}`, `Domínios de referência verificados: ${r.referringDomains}`, `Links perdidos confirmados: ${r.lostLinks}`, '', 'Estágios combinam inventário e submissões comprovadas no ledger; awaiting_review indica fila; published é declaração e link_confirmed exige verificação HTTP.', ...Object.entries(r.stages).map(([s,n]) => `- ${s}: ${n}`), '', 'Tráfego GA4, cliques Search Console, DA e DR: não disponíveis (null).', 'Presença HTML não comprova indexação nem tráfego. Erros temporários não confirmam perda.', '', '## Priorização por evidência', '', ...r.ranked.map(t => `- ${t.id}: ${t.points}/100; critérios sem evidência: ${t.unknown.join(', ') || 'nenhum'}`), ''].join('\n');
}
