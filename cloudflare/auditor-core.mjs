// Pure, auditable domain validation. No Gemini dependency and no retained documents.
export const MONEY_FIELDS = Object.freeze(['grossPassengerCents','platformFeeCents','driverPayoutCents','tipsCents','incentivesCents','reimbursementsCents','grossTotalCents']);
const nullableCents = x => x === null || (Number.isSafeInteger(x) && x >= 0 && x <= 100_000_000_00);
const date = x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x)) && new Date(x+'T00:00:00Z').toISOString().slice(0,10) === x;
export function validateExtraction(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('JSON de extração inválido');
  if (value.platform !== 'Uber') throw Error('Documento não reconhecido como demonstrativo Uber');
  if (!['earnings_statement','annual_earnings_statement'].includes(value.documentType)) throw Error('Tipo de PDF da Uber não suportado');
  // Never reflect arbitrary model strings (names, addresses, instructions) in dates.
  const report = { platform:'Uber', documentType: value.documentType, periodStart: date(value.periodStart)?value.periodStart:null, periodEnd:date(value.periodEnd)?value.periodEnd:null };
  const issues = [];
  if (!date(report.periodStart) || !date(report.periodEnd) || report.periodStart > report.periodEnd)
    issues.push('PERIODO_INDEFINIDO');
  if (value.documentType === 'annual_earnings_statement' && date(report.periodStart) && date(report.periodEnd) &&
    (report.periodStart !== report.periodStart.slice(0,4)+'-01-01' ||
     report.periodEnd !== report.periodStart.slice(0,4)+'-12-31')) issues.push('PERIODO_ANUAL_INCONSISTENTE');
  for (const field of MONEY_FIELDS) {
    if (!Object.hasOwn(value,field) || !nullableCents(value[field])) throw Error('Campo monetário inválido: '+field);
    report[field]=value[field];
  }
  if (value.kilometers !== null && !(typeof value.kilometers === 'number' && Number.isFinite(value.kilometers) && value.kilometers >= 0 && value.kilometers <= 200000)) throw Error('Quilometragem inválida');
  report.kilometers=value.kilometers;
  if (report.grossPassengerCents === null) issues.push('BRUTO_NAO_COMPROVADO');
  if (report.driverPayoutCents === null) issues.push('REPASSE_NAO_COMPROVADO');
  if (report.grossTotalCents === null) issues.push('TOTAL_BRUTO_NAO_COMPROVADO');
  // Do not assert gross-fee=payout; tips, incentives and reimbursements can change reconciliation.
  if (report.grossPassengerCents !== null && report.platformFeeCents !== null && report.driverPayoutCents !== null) {
    const parts = ['grossPassengerCents','tipsCents','incentivesCents'];
    if (parts.every(k=>report[k]!==null) && report.grossTotalCents!==null &&
        parts.reduce((sum,k)=>sum+report[k],0)!==report.grossTotalCents) issues.push('COMPOSICAO_BRUTO_PENDENTE');
    if (report.grossTotalCents!==null && report.reimbursementsCents!==null &&
        report.grossTotalCents-report.platformFeeCents+report.reimbursementsCents!==report.driverPayoutCents) issues.push('RECONCILIACAO_PENDENTE');
    if (report.grossTotalCents===null || report.reimbursementsCents===null) issues.push('RECONCILIACAO_INCOMPLETA');
  }
  if (report.platformFeeCents===null) issues.push('TAXAS_NAO_COMPROVADAS');
  if (!value.evidence || typeof value.evidence !== 'object' || Array.isArray(value.evidence)) throw Error('Origem documental ausente');
  report.evidence = {};
  for (const field of MONEY_FIELDS) {
    const e=value.evidence[field];
    if (typeof e !== 'string') throw Error('Evidência inválida: '+field);
    // Evidence is a short category/label, never an unbounded quote or personal identifier.
    // Return only allowlisted provenance, never free-form model text with PII.
    const labels={grossPassengerCents:'Ganhos brutos com viagens',grossTotalCents:'Ganhos brutos totais',platformFeeCents:'Total de taxas e despesas',driverPayoutCents:'Ganhos líquidos totais',tipsCents:'Extras (valor dado pelo usuário)',incentivesCents:'Ganhos promocionais',reimbursementsCents:'Reembolsos'};
    report.evidence[field]=e.trim()?labels[field]:'';
    if (report[field] !== null && !report.evidence[field]) issues.push('EVIDENCIA_AUSENTE_'+field);
  }
  return {report,issues,status:issues.length?'review':'ready'};
}
export function periodsOverlap(a,b) {
  return date(a?.periodStart) && date(a?.periodEnd) && date(b?.periodStart) && date(b?.periodEnd) &&
    a.periodStart <= b.periodEnd && b.periodStart <= a.periodEnd;
}
// Prefer the official full-year statement over embedded monthly totals, never add both.
export function selectCanonicalReports(rows) {
  const accepted = rows.filter(x => x.status === 'ready' && x.report);
  const ranked = [...accepted].sort((a,b)=>Number(b.report.documentType === 'annual_earnings_statement') - Number(a.report.documentType === 'annual_earnings_statement'));
  const selected = [], excluded = [];
  for (const item of ranked) {
    if (selected.some(other => periodsOverlap(item.report,other.report))) excluded.push(item);
    else selected.push(item);
  }
  return {selected,excluded};
}
export function fiscalEstimate(reports,{taxYear,profile,eligible,confirmedGross}={}) {
  const rules = {2025:'PF_PASSENGER_TRANSPORT_2025_60_40',2026:'PF_PASSENGER_TRANSPORT_2026_60_40'};
  if (!Object.hasOwn(rules,taxYear) || profile !== 'pf' || eligible !== true || confirmedGross !== true)
    return {status:'review_required',reason:'Enquadramento PF e origem da base bruta precisam de confirmação'};
  if (!Array.isArray(reports)||!reports.length || reports.some(r=>r.grossPassengerCents===null || r.grossPassengerCents===undefined || !nullableCents(r.grossPassengerCents)))
    return {status:'review_required',reason:'Base bruta de transporte não comprovada'};
  if (reports.some(r => !date(r.periodStart) || !date(r.periodEnd) ||
    r.periodStart.slice(0,4) !== String(taxYear) || r.periodEnd.slice(0,4) !== String(taxYear)))
    return {status:'review_required',reason:'Os demonstrativos precisam pertencer integralmente ao ano-calendário selecionado'};
  if (reports.some((r,i)=>reports.slice(0,i).some(prev=>periodsOverlap(prev,r))))
    return {status:'review_required',reason:'Períodos sobrepostos: documentos anuais e mensais não podem ser somados'};
  const gross=reports.reduce((a,r)=>a+r.grossPassengerCents,0);
  if (!Number.isSafeInteger(gross)) return {status:'review_required',reason:'Valores excedem limite seguro'};
  if (reports.some(r=>['tipsCents','incentivesCents','reimbursementsCents'].some(k=>r[k]!==0)))
    return {status:'review_required',reason:'Extras, incentivos e reembolsos exigem classificação fiscal própria; valores ausentes não são zero'};
  const taxable=Number((BigInt(gross)*60n+99n)/100n);
  return {status:'indicative',taxYear,grossBaseCents:gross,minimumTaxableCents:taxable,maximumNonTaxableCents:gross-taxable,rule:rules[taxYear],notice:'Estimativa sujeita a verificação de base, renda adicional e regras da Receita. Não é declaração nem DARF.'};
}
export function consolidate(rows) {
  const {selected:accepted,excluded}=selectCanonicalReports(rows);
  const totals=Object.fromEntries(MONEY_FIELDS.map(k=>[k,accepted.some(x=>x.report[k]===null)?null:accepted.reduce((a,x)=>a+x.report[k],0)]));
  return {acceptedCount:accepted.length,excludedCount:rows.length-accepted.length,overlapExcludedCount:excluded.length,totals};
}
