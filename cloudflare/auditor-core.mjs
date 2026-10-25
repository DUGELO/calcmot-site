// Pure, auditable domain validation. No Gemini dependency and no retained documents.
export const MONEY_FIELDS = Object.freeze(['grossPassengerCents','platformFeeCents','driverPayoutCents','tipsCents','incentivesCents','reimbursementsCents']);
const nullableCents = x => x === null || (Number.isSafeInteger(x) && x >= 0 && x <= 100_000_000_00);
const date = x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x)) && new Date(x+'T00:00:00Z').toISOString().slice(0,10) === x;
export function validateExtraction(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('JSON de extração inválido');
  if (value.platform !== 'Uber') throw Error('Documento não reconhecido como demonstrativo Uber');
  const report = { platform:'Uber', documentType: 'earnings_statement', periodStart: value.periodStart ?? null, periodEnd:value.periodEnd ?? null };
  const issues = [];
  if (!date(report.periodStart) || !date(report.periodEnd) || report.periodStart > report.periodEnd)
    issues.push('PERIODO_INDEFINIDO');
  for (const field of MONEY_FIELDS) {
    if (!Object.hasOwn(value,field) || !nullableCents(value[field])) throw Error('Campo monetário inválido: '+field);
    report[field]=value[field];
  }
  if (value.kilometers !== null && !(typeof value.kilometers === 'number' && Number.isFinite(value.kilometers) && value.kilometers >= 0 && value.kilometers <= 200000)) throw Error('Quilometragem inválida');
  report.kilometers=value.kilometers;
  if (report.grossPassengerCents === null) issues.push('BRUTO_NAO_COMPROVADO');
  if (report.driverPayoutCents === null) issues.push('REPASSE_NAO_COMPROVADO');
  // Do not assert gross-fee=payout; tips, incentives and reimbursements can change reconciliation.
  if (report.grossPassengerCents !== null && report.platformFeeCents !== null && report.driverPayoutCents !== null) {
    const potential = report.grossPassengerCents - report.platformFeeCents + (report.tipsCents ?? 0) + (report.incentivesCents ?? 0) + (report.reimbursementsCents ?? 0);
    if (Math.abs(potential-report.driverPayoutCents)>100) issues.push('RECONCILIACAO_PENDENTE');
  }
  report.evidence = {};
  for (const field of MONEY_FIELDS) {
    const e=value.evidence && typeof value.evidence === 'object' && value.evidence[field];
    report.evidence[field] = typeof e === 'string' ? e.slice(0,120) : '';
  }
  return {report,issues,status:issues.length?'review':'ready'};
}
export function fiscalEstimate(reports,{taxYear,profile,eligible,confirmedGross}={}) {
  if (taxYear !== 2025 || profile !== 'pf' || eligible !== true || confirmedGross !== true)
    return {status:'review_required',reason:'Enquadramento PF, ano 2025 e base bruta precisam de confirmação'};
  if (!Array.isArray(reports)||!reports.length || reports.some(r=>r.grossPassengerCents===null || r.grossPassengerCents===undefined || !nullableCents(r.grossPassengerCents)))
    return {status:'review_required',reason:'Base bruta de transporte não comprovada'};
  const gross=reports.reduce((a,r)=>a+r.grossPassengerCents,0);
  if (!Number.isSafeInteger(gross)) return {status:'review_required',reason:'Valores excedem limite seguro'};
  const taxable=Math.ceil(gross*60/100);
  return {status:'indicative',taxYear:2025,grossBaseCents:gross,minimumTaxableCents:taxable,maximumNonTaxableCents:gross-taxable,rule:'PF_PASSENGER_TRANSPORT_2025_60_40',notice:'Estimativa sujeita a verificação de base, renda adicional e regras da Receita. Não é declaração nem DARF.'};
}
export function consolidate(rows) {
  const accepted=rows.filter(x=>x.status==='ready' && x.report);
  const totals=Object.fromEntries(MONEY_FIELDS.map(k=>[k,accepted.some(x=>x.report[k]===null)?null:accepted.reduce((a,x)=>a+x.report[k],0)]));
  return {acceptedCount:accepted.length,excludedCount:rows.length-accepted.length,totals};
}
