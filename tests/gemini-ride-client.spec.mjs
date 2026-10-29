import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateRideAnalysis, DEFAULT_MODEL } from '../cloudflare/gemini-ride-client.mjs';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/ride-analysis.json',import.meta.url),'utf8'));
const ok=()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(fixture)}]}}]});
const env={GEMINI_API_KEY:'never-log-this'};

async function scenario(responses,extraEnv={},extraOptions={}){
  const calls=[],waits=[],logs=[];
  let clock=0;
  const result=await generateRideAnalysis({...env,...extraEnv},{contextoDoMotorista:'private input'}, {
    now:()=>clock,random:()=>0,log:value=>logs.push(value),
    sleep:async(ms,signal)=>{assert.equal(signal.aborted,false);waits.push(ms);clock+=ms;},
    fetcher:async(url,options)=>{calls.push({url,options});const response=responses.shift();if(response instanceof Error)throw response;if(typeof response==='function')return response();assert.ok(response,'Too many attempts');return response;},
    ...extraOptions,
  });
  assert.ok(logs.every(value=>!value.includes('never-log-this')&&!value.includes('private input')));
  return {result,calls,waits,logs};
}

let run=await scenario([new Response('',{status:503}),ok()]);
assert.equal(run.result.ok,true);assert.deepEqual(run.waits,[1000]);assert.equal(run.calls.length,2);
assert.ok(run.calls.every(call=>call.url.includes(DEFAULT_MODEL)));
assert.deepEqual(JSON.parse(run.calls[0].options.body).generationConfig.thinkingConfig,{thinkingLevel:'low'});

run=await scenario([new Response('',{status:503}),new Response('',{status:502}),ok()],{GEMINI_FALLBACK_MODEL:'gemini-3.5-flash-lite'});
assert.equal(run.result.ok,true);assert.deepEqual(run.waits,[1000,2000]);assert.equal(run.calls.length,3);
assert.ok(run.calls[2].url.includes('gemini-3.5-flash-lite'));
assert.deepEqual(JSON.parse(run.calls[2].options.body).generationConfig.thinkingConfig,{thinkingLevel:'minimal'});

run=await scenario([new Response('',{status:503}),new Response('',{status:503})]);
assert.equal(run.result.code,'AI_BUSY');assert.equal(run.result.status,503);assert.equal(run.calls.length,2);

for(const status of [400,401,402,403,404,429]){
  run=await scenario([new Response('',{status})],{GEMINI_FALLBACK_MODEL:'gemini-3.5-flash-lite'});
  assert.equal(run.calls.length,1);assert.equal(run.waits.length,0);
  assert.equal(run.result.code,status===429?'AI_PROVIDER_LIMIT':'AI_CONFIGURATION');
}
run=await scenario([new Response('',{status:503,headers:{'Retry-After':'3'}}),ok()]);
assert.deepEqual(run.waits,[3000]);assert.equal(run.result.ok,true);
run=await scenario([new Response('',{status:503,headers:{'Retry-After':'60'}}),ok()]);
assert.equal(run.calls.length,1);assert.equal(run.waits.length,0);assert.equal(run.result.code,'AI_BUSY');
assert.equal(run.result.retryAfter,60);

run=await scenario([new DOMException('timed out','TimeoutError'),ok()]);
assert.equal(run.result.ok,true);assert.equal(run.calls.length,2);
run=await scenario([new DOMException('timed out','TimeoutError'),new DOMException('timed out','TimeoutError')]);
assert.equal(run.result.code,'AI_TIMEOUT');assert.equal(run.result.status,504);
run=await scenario([new Error('network'),new Error('network')]);
assert.equal(run.result.code,'AI_NETWORK');
run=await scenario([new Response('not JSON',{status:200})]);
assert.equal(run.result.code,'AI_INVALID_RESPONSE');assert.equal(run.calls.length,1);
run=await scenario([Response.json(null)]);
assert.equal(run.result.code,'AI_INVALID_RESPONSE');assert.equal(run.calls.length,1);
run=await scenario([Response.json({candidates:[{finishReason:'SAFETY'}]})],{GEMINI_FALLBACK_MODEL:'gemini-3.5-flash-lite'});
assert.equal(run.result.code,'AI_CONTENT_BLOCKED');assert.equal(run.calls.length,1);
run=await scenario([Response.json({candidates:[{finishReason:'MAX_TOKENS'}]})]);
assert.equal(run.result.code,'AI_INVALID_RESPONSE');

const controller=new AbortController();controller.abort();
run=await scenario([],{},{signal:controller.signal});assert.equal(run.result.code,'AI_CANCELLED');assert.equal(run.calls.length,0);
const inFlight=new AbortController();
run=await scenario([()=>{inFlight.abort();throw new DOMException('cancelled','AbortError');}],{GEMINI_FALLBACK_MODEL:'gemini-3.5-flash-lite'},{signal:inFlight.signal});
assert.equal(run.result.code,'AI_CANCELLED');assert.equal(run.calls.length,1);
const late=new AbortController();
run=await scenario([()=>{late.abort();return ok();}],{},{signal:late.signal});
assert.equal(run.result.code,'AI_CANCELLED');assert.equal(run.calls.length,1);
const duringPause=new AbortController();
run=await scenario([new Response('',{status:503})],{GEMINI_FALLBACK_MODEL:'gemini-3.5-flash-lite'},{signal:duringPause.signal,sleep:async()=>{duringPause.abort();throw duringPause.signal.reason;}});
assert.equal(run.result.code,'AI_CANCELLED');assert.equal(run.calls.length,1);
run=await scenario([],{GEMINI_MODEL:'../bad-path'});assert.equal(run.result.code,'AI_CONFIGURATION');assert.equal(run.calls.length,0);
let elapsed=0,deadlineCalls=0;
const expired=await generateRideAnalysis(env,{}, {now:()=>elapsed,log:()=>{},fetcher:async()=>{deadlineCalls++;elapsed=40001;throw new DOMException('timeout','TimeoutError');}});
assert.equal(expired.code,'AI_TIMEOUT');assert.equal(deadlineCalls,1,'Não iniciar nova tentativa após o prazo total');
console.log('Gemini resilience: bounded retry/backoff, opt-in fallback, error codes, Retry-After, invalid output, cancellation and private logs OK.');
