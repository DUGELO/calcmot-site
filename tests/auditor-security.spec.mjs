import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {handleAuditorRequest,handleAuditorConfig,MAX_INPUT_TOKENS} from '../cloudflare/auditor-api.mjs';
import {inspectPdf} from '../cloudflare/auditor-pdf.mjs';
import {validateExtraction,fiscalEstimate,consolidate} from '../cloudflare/auditor-core.mjs';

const realFetch=globalThis.fetch;
after(()=>{globalThis.fetch=realFetch;});
const pdf=await PDFDocument.create();pdf.addPage();
const pdfBytes=await pdf.save({useObjectStreams:false});
const sample={platform:'Uber',documentType:'earnings_statement',periodStart:'2026-01-01',periodEnd:'2026-01-31',grossPassengerCents:1601,grossTotalCents:1601,platformFeeCents:401,driverPayoutCents:1200,tipsCents:0,incentivesCents:0,reimbursementsCents:0,kilometers:4,evidence:Object.fromEntries(['grossPassengerCents','grossTotalCents','platformFeeCents','driverPayoutCents','tipsCents','incentivesCents','reimbursementsCents'].map(k=>[k,'documentado']))};
const env={GEMINI_API_KEY:'test-secret-not-real',TURNSTILE_SECRET_KEY:'test-secret-not-real',AUDITOR_RATE_LIMITER:{limit:async()=>({success:true})},AUDITOR_GLOBAL_RATE_LIMITER:{limit:async()=>({success:true})},AUDITOR_DATA_PROCESSING_APPROVED:'true',AUDITOR_TURNSTILE_SITE_KEY:'0x00000000000000000000'};
function request({bytes=pdfBytes,token='synthetic-token-not-real',headers={},duplicate=false}={}){
 const form=new FormData();form.set('document',new Blob([bytes],{type:'application/pdf'}),'synthetic.pdf');
 form.set('turnstile_token',token);if(duplicate)form.append('document',new Blob([bytes],{type:'application/pdf'}),'duplicate.pdf');
 return new Request('https://calcmot.com.br/auditor-interno/analisar',{method:'POST',headers:{Origin:'https://calcmot.com.br','CF-Connecting-IP':'192.0.2.1',...headers},body:form});
}
function mock({verify={},providerStatus=200,answer,tokenCount=1200,countStatus=200}={}){
 const calls=[];
 globalThis.fetch=async(url,options)=>{
  calls.push({url,options});
  if(url.includes('siteverify'))return Response.json({success:true,hostname:'calcmot.com.br',action:'auditor_ganhos',...verify});
  if(url.endsWith(':countTokens'))return Response.json({totalTokens:tokenCount},{status:countStatus});
  return Response.json(answer??{candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(sample)}]}}],usageMetadata:{promptTokenCount:1200,candidatesTokenCount:300,totalTokenCount:1500}},{status:providerStatus});
 };
 return calls;
}
test('public config exposes only sitekey and fails closed',()=>{
 const req=new Request('https://calcmot.com.br/auditor-interno/config');
 return Promise.all([handleAuditorConfig(req,env).json(),handleAuditorConfig(req,{}).json()]).then(([yes,no])=>{assert.deepEqual(yes,{enabled:true,siteKey:env.AUDITOR_TURNSTILE_SITE_KEY});assert.deepEqual(no,{enabled:false,siteKey:''});});
});
for(const key of ['GEMINI_API_KEY','TURNSTILE_SECRET_KEY','AUDITOR_RATE_LIMITER','AUDITOR_GLOBAL_RATE_LIMITER','AUDITOR_DATA_PROCESSING_APPROVED','AUDITOR_TURNSTILE_SITE_KEY'])test('missing '+key+' blocks before provider',async()=>{const calls=mock();assert.equal((await handleAuditorRequest(request(),{...env,[key]:undefined})).status,503);assert.equal(calls.length,0);});
test('wrong origin, method and missing edge identity are blocked',async()=>{
 const calls=mock();
 assert.equal((await handleAuditorRequest(request({headers:{Origin:'https://attacker.invalid'}}),env)).status,403);
 assert.equal((await handleAuditorRequest(new Request('https://calcmot.com.br',{headers:{Origin:'https://calcmot.com.br'}}),env)).status,405);
 const req=request();req.headers.delete('CF-Connecting-IP');assert.equal((await handleAuditorRequest(req,env)).status,403);assert.equal(calls.length,0);
});
test('rate limiter failures and outages fail closed',async()=>{
 const calls=mock();
 assert.equal((await handleAuditorRequest(request(),{...env,AUDITOR_RATE_LIMITER:{limit:async()=>({success:false})}})).status,429);
 assert.equal((await handleAuditorRequest(request(),{...env,AUDITOR_RATE_LIMITER:{limit:async()=>{throw Error('private-detail');}}})).status,503);assert.equal(calls.length,0);
});
for(const verify of [{success:false},{hostname:'attacker.invalid'},{action:'other'},{success:false,'error-codes':['timeout-or-duplicate']}])test('invalid hostname/action/token/replay '+JSON.stringify(verify),async()=>{const calls=mock({verify});assert.equal((await handleAuditorRequest(request(),env)).status,403);assert.equal(calls.length,1);});
test('Turnstile outage blocks processing',async()=>{globalThis.fetch=async()=>{throw Error('private error');};const r=await handleAuditorRequest(request(),env);assert.equal(r.status,503);assert.equal((await r.json()).code,'VERIFICATION_UNAVAILABLE');});
test('multipart duplicates and oversized declared body are blocked',async()=>{const calls=mock();assert.equal((await handleAuditorRequest(request({duplicate:true}),env)).status,400);assert.equal((await handleAuditorRequest(request({headers:{'content-length':'9999999'}}),env)).status,413);assert.equal(calls.length,0);});
test('chunked oversized body cannot bypass length limit',async()=>{const calls=mock();const req=new Request('https://calcmot.com.br',{method:'POST',headers:{Origin:'https://calcmot.com.br','CF-Connecting-IP':'192.0.2.1','Content-Type':'multipart/form-data; boundary=test'},body:new Uint8Array(4*1024*1024+16385)});assert.equal((await handleAuditorRequest(req,env)).status,413);assert.equal(calls.length,0);});
test('valid PDF accepted, malformed signature-only PDF rejected',async()=>{assert.equal((await inspectPdf(pdfBytes)).pages,1);await assert.rejects(()=>inspectPdf(new TextEncoder().encode('%PDF-1.7\nmalformed\n%%EOF')),/INVALID_PDF/);});
test('nine pages rejected before Gemini',async()=>{const doc=await PDFDocument.create();for(let i=0;i<9;i++)doc.addPage();const bytes=await doc.save({useObjectStreams:false});const calls=mock();assert.equal((await (await handleAuditorRequest(request({bytes}),env)).json()).code,'PDF_PAGE_LIMIT');assert.equal(calls.length,1);});
test('active JavaScript and compressed object streams rejected',async()=>{
 const doc=await PDFDocument.create();doc.addPage();doc.addJavaScript('test','app.alert("no");');
 const active=await doc.save({useObjectStreams:false});await assert.rejects(()=>inspectPdf(active),/UNSAFE_PDF/);
 const compressed=await pdf.save();await assert.rejects(()=>inspectPdf(compressed),/PDF_FORMAT_UNSUPPORTED/);
});
test('global throttle prevents all Gemini calls',async()=>{const calls=mock();const r=await handleAuditorRequest(request(),{...env,AUDITOR_GLOBAL_RATE_LIMITER:{limit:async()=>({success:false})}});assert.equal(r.status,429);assert.equal(calls.length,1);});
test('concurrency admits at most two requests per isolate',async()=>{
 mock();const one=handleAuditorRequest(request(),env),two=handleAuditorRequest(request(),env);
 const three=await handleAuditorRequest(request(),env);assert.equal(three.status,429);assert.equal((await three.json()).code,'BUSY');
 assert.equal((await one).status,200);assert.equal((await two).status,200);
});
test('provider deadline yields a safe timeout with no report',async()=>{
 const timeout=AbortSignal.timeout;
 AbortSignal.timeout=()=>{const c=new AbortController();setTimeout(()=>c.abort(new DOMException('Timed out','TimeoutError')),5);return c.signal;};
 try{
  const fake=mock();const goodFetch=globalThis.fetch;
  globalThis.fetch=(url,options)=>url.endsWith(':generateContent')?new Promise((resolve,reject)=>{
   if(options.signal.aborted)reject(options.signal.reason);else options.signal.addEventListener('abort',()=>reject(options.signal.reason),{once:true});
  }):goodFetch(url,options);
  const r=await handleAuditorRequest(request(),env);assert.equal(r.status,504);assert.deepEqual(await r.json(),{code:'PROVIDER_TIMEOUT'});
 }finally{AbortSignal.timeout=timeout;}
});
test('countTokens cap rejects before generation',async()=>{const calls=mock({tokenCount:MAX_INPUT_TOKENS+1});assert.equal((await handleAuditorRequest(request(),env)).status,422);assert.equal(calls.length,2);});
for(const tokenCount of [null,0,'100',-1])test('invalid token count '+tokenCount,async()=>{const calls=mock({tokenCount});assert.equal((await handleAuditorRequest(request(),env)).status,502);assert.equal(calls.length,2);});
test('provider quota distinguished from availability',async()=>{mock({providerStatus:429});const r=await handleAuditorRequest(request(),env);assert.equal(r.status,503);assert.equal((await r.json()).code,'PROVIDER_QUOTA');});
for(const answer of [{candidates:[]},{candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'{}'}]}}]},{candidates:[{finishReason:'STOP',content:{parts:[{text:'not JSON'}]}}]}])test('incomplete or invalid provider output rejected',async()=>{mock({answer});assert.equal((await handleAuditorRequest(request(),env)).status,422);});
test('safe extraction returns no-store and only canonical fields, not PII',async()=>{
 const privateSample={...sample,customer:'private-user',periodStart:'2026-01-01',evidence:Object.fromEntries(Object.keys(sample.evidence).map(k=>[k,'PRIVATE NAME 123.456.789-00 street bank account']))};
 mock({answer:{candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(privateSample)}]}}]}});
 const response=await handleAuditorRequest(request(),env);assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/no-store/);const text=await response.text();assert.doesNotMatch(text,/PRIVATE|123\.456|private-user|bank account/);assert.equal(JSON.parse(text).report.driverPayoutCents,1200);
});
test('missing fields stay null and one-cent discrepancy requires review',()=>{
 const nulls=validateExtraction({...sample,tipsCents:null});assert.equal(nulls.report.tipsCents,null);
 const report=validateExtraction({...sample,driverPayoutCents:1201});assert.equal(report.status,'review');assert.ok(report.issues.includes('RECONCILIACAO_PENDENTE'));
 assert.equal(validateExtraction({...sample,periodStart:'PRIVATE ADDRESS'}).report.periodStart,null);
});
test('annual priority, years and monetary critical corpus',()=>{
 const values=[['2025-01-01','2025-12-31',1841354,2900,1844254,306591,1537663],['2025-11-01','2025-11-30',528409,2200,530609,92788,437821],['2025-12-01','2025-12-31',184282,0,184282,24101,160181],['2026-01-01','2026-01-31',1601,0,1601,401,1200],['2026-02-01','2026-02-28',77643,0,77643,9160,68483],['2026-03-01','2026-03-31',10816,0,10816,2753,8063]];
 const rows=values.map(([periodStart,periodEnd,grossPassengerCents,tipsCents,grossTotalCents,platformFeeCents,driverPayoutCents],i)=>validateExtraction({...sample,documentType:i===0?'annual_earnings_statement':'earnings_statement',periodStart,periodEnd,grossPassengerCents,tipsCents,grossTotalCents,platformFeeCents,driverPayoutCents}));
 assert.ok(rows.every(r=>r.status==='ready'));assert.equal(consolidate(rows).acceptedCount,4);assert.equal(consolidate(rows).totals.grossTotalCents,1934314);assert.equal(consolidate(rows).totals.driverPayoutCents,1615409);
 const options={taxYear:2026,profile:'pf',eligible:true,confirmedGross:true};assert.equal(fiscalEstimate(rows.slice(3).map(r=>r.report),options).minimumTaxableCents,54036);assert.equal(fiscalEstimate([rows[0].report],{...options,taxYear:2025}).status,'review_required');
});
