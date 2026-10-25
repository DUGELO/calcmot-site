import assert from 'node:assert/strict';
import {validateExtraction,fiscalEstimate,consolidate} from '../cloudflare/auditor-core.mjs';
const sample={platform:'Uber',periodStart:'2025-03-01',periodEnd:'2025-03-07',
 grossPassengerCents:100001,platformFeeCents:20000,driverPayoutCents:80001,
 tipsCents:0,incentivesCents:0,reimbursementsCents:0,kilometers:152,
 evidence:{grossPassengerCents:'total pago pelos passageiros',platformFeeCents:'taxa da Uber',driverPayoutCents:'repasse',tipsCents:'nenhum',incentivesCents:'nenhum',reimbursementsCents:'nenhum'}};
const ok=validateExtraction(sample);
assert.equal(ok.status,'ready');assert.deepEqual(ok.issues,[]);
assert.equal(consolidate([ok]).totals.driverPayoutCents,80001);
const tax=fiscalEstimate([ok.report],{taxYear:2025,profile:'pf',eligible:true,confirmedGross:true});
assert.equal(tax.status,'indicative');assert.equal(tax.grossBaseCents,100001);
assert.equal(tax.minimumTaxableCents,60001);assert.equal(tax.maximumNonTaxableCents,40000);
for(const user of [
 {taxYear:2025,profile:'mei',eligible:true,confirmedGross:true},
 {taxYear:2026,profile:'pf',eligible:true,confirmedGross:true},
 {taxYear:2025,profile:'pf',eligible:false,confirmedGross:true},
 {taxYear:2025,profile:'pf',eligible:true,confirmedGross:false}
])assert.equal(fiscalEstimate([ok.report],user).status,'review_required');
assert.equal(fiscalEstimate([{...ok.report,grossPassengerCents:null}],{taxYear:2025,profile:'pf',eligible:true,confirmedGross:true}).status,'review_required');
assert.equal(validateExtraction({...sample,grossPassengerCents:null}).status,'review');
assert.ok(validateExtraction({...sample,driverPayoutCents:100000}).issues.includes('RECONCILIACAO_PENDENTE'));
for(const bad of [
 {...sample,periodStart:'2025-13-01'},
 {...sample,platform:'99'},
 {...sample,grossPassengerCents:-100},
 {...sample,kilometers:-3},
 {...sample,platformFeeCents:'200.10'},
 {...sample,periodStart:'2025-03-12',periodEnd:'2025-03-01'}
]){try{const v=validateExtraction(bad);assert.equal(v.status,'review');}catch(e){assert.ok(e instanceof Error);}}
console.log('Auditor fiscal e validação determinística: PASS');
