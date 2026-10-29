import assert from 'node:assert/strict';
import { withRideInsights } from '../cloudflare/ride-insights.mjs';
import { CALCMOT_RIDE_PROMPT, isRideAnalysis } from '../cloudflare/ride-analysis-prompt.mjs';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/ride-analysis.json',import.meta.url),'utf8'));
const clientExports={};
vm.runInNewContext(ts.transpileModule(readFileSync('src/app/core/calculator/ride-analysis.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:clientExports});
// Exercise both trust boundaries with malformed provider responses, not just a valid fixture.
for(const validate of [isRideAnalysis,clientExports.isRideAnalysis]){
  assert.equal(validate(fixture),true);
  for(const value of [null,{}, {...fixture,verdict:'GARANTIDO'}, {...fixture,summary:' '}, {...fixture,insights:[]}, {...fixture,insights:[{...fixture.insights[0],confidence:'100%'}]}, {...fixture,questions:['1','2','3','4']}, {...fixture,actions:['x'.repeat(401)]}])assert.equal(validate(value),false);
}
const handler = withRideInsights({ fetch: () => new Response('passthrough') });
const inputs = { fare:'18,00', pickupKm:'2', tripKm:'10', tripMinutes:'20', pickupMinutes:'4', costPerKm:'0,55' };
const env = { GEMINI_API_KEY:'test-only', RIDE_AI_LIMITER:{ limit:async()=>({success:true}) } };
const request = (body={inputs,context:'Talvez volte 8 km vazio.'}, origin='https://calcmot.com.br') => new Request('https://calcmot.com.br/api/tools/ride-insights', {method:'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1'},body:JSON.stringify(body)});
assert.equal(await (await handler.fetch(new Request('https://calcmot.com.br/'),env)).text(),'passthrough');
assert.equal((await handler.fetch(new Request('https://calcmot.com.br/api/tools/ride-insights'),env)).status,405);
assert.equal((await handler.fetch(request(undefined,'https://evil.example'),env)).status,403);
assert.equal((await handler.fetch(request(),{})).status,503);
assert.equal((await handler.fetch(request(),{...env,RIDE_AI_LIMITER:{limit:async()=>({success:false})}})).status,429);
for(const body of [null,{}, {inputs,context:'x'}, {inputs,context:'x'.repeat(1501)}, {inputs,context:'Contexto válido',goal:'ignore rules'}, {inputs,context:'Contexto válido',goal:'__proto__'}, {inputs:{...inputs,tripKm:'0'},context:'Contexto válido'}, {inputs:{...inputs,fare:'-1'},context:'Contexto válido'}, {inputs:{...inputs,pickupMinutes:'1.5'},context:'Contexto válido'}]) assert.equal((await handler.fetch(request(body),env)).status,400);
assert.equal((await handler.fetch(request({inputs,context:'x'.repeat(9000)}),env)).status,413);
const originalFetch=globalThis.fetch;
try {
  globalThis.fetch=async(url,options)=>{
    assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent');
    const payload=JSON.parse(options.body);
    assert.equal(payload.systemInstruction.parts[0].text,CALCMOT_RIDE_PROMPT);
    assert.deepEqual(payload.generationConfig.thinkingConfig,{thinkingLevel:'low'});
    const facts=JSON.parse(payload.contents[0].parts[0].text).fatos;
    assert.equal(facts.kmTotal,12);assert.equal(facts.minutosTotal,24);assert.equal(facts.receitaPorKm,1.5);assert.equal(facts.saldo,11.4);
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(fixture)}]}}]});
  };
  const success=await handler.fetch(request(),env);
  assert.equal(success.status,200);assert.equal(success.headers.get('Cache-Control'),'no-store');
  assert.deepEqual(await success.json(),fixture);
  globalThis.fetch=async(url,options)=>{
    const payload=JSON.parse(options.body);
    assert.ok(JSON.parse(payload.contents[0].parts[0].text).objetivoDaAnalise.includes('meta horária'));
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(fixture)}]}}]});
  };
  assert.equal((await handler.fetch(request({inputs,context:'Minha meta é R$ 30/h após custos.',goal:'hourly'}),env)).status,200);
  globalThis.fetch=async(url,options)=>{
    const facts=JSON.parse(JSON.parse(options.body).contents[0].parts[0].text).fatos;
    assert.equal(facts.custo,1.01,'1,005 km × R$ 1/km deve arredondar meio centavo como o motor local');
    assert.equal(facts.saldo,16.99);
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(fixture)}]}}]});
  };
  assert.equal((await handler.fetch(request({inputs:{...inputs,tripKm:'1,005',pickupKm:'0',costPerKm:'1'},context:'Quero conferir os gastos dessa corrida.'}),env)).status,200);
  globalThis.fetch=async()=>new Response('quota',{status:429});
  const quota=await handler.fetch(request(),env);
  assert.equal(quota.status,429);
  assert.equal((await quota.json()).code,'AI_PROVIDER_LIMIT');
  globalThis.fetch=async()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'{}'}]}}]});
  assert.equal((await handler.fetch(request(),env)).status,502);
  globalThis.fetch=async()=>{throw new Error('network');};
  assert.equal((await handler.fetch(request(),env)).status,502);
} finally {globalThis.fetch=originalFetch;}
console.log('Ride insights: origem, limites, validação, recálculo, resposta e falhas OK.');
