import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcile, runCycle} from '../../scripts/growth/persistent-cycle.mjs';
const link={outcome:'present', linkFound:true,httpStatus:200,referringDomain:'site.example',finalUrl:'https://site.example/article',checkedAt:'2026-10-29T18:00:00Z'};
const source={targets:[{id:'a',name:'A',publishedUrl:'https://site.example/article',stage:'published'}, {id:'b',name:'B',submitUrl:'https://queued.example',stage:'awaiting_review'}]};
test('recovery prefers confirmed previous state without duplicating records', ()=>{
 const prev={targets:[{...source.targets[0],stage:'link_confirmed',verification:link}]};
 const data=reconcile(source,prev);
 assert.equal(data.targets.length,2); assert.equal(data.targets[0].stage,'link_confirmed'); assert.equal(data.targets[0].verification.checkedAt,link.checkedAt);
});
test('temporary error keeps last successful proof but records failure', async ()=>{
 const prev={targets:[{...source.targets[0],stage:'link_confirmed',verification:link}]};
 const data=await runCycle(source,prev,{check:async()=>({outcome:'temporary_error',error:'timeout',checkedAt:'2026-10-29T19:00:00Z'})});
 assert.equal(data.targets[0].verification.outcome,'present');
 assert.equal(data.targets[0].lastAttempt.outcome,'temporary_error');
 assert.equal(data.targets[0].verification.checkedAt,link.checkedAt);
 assert.equal(data.lastCycle.outcomes.temporary_error,1);
});
test('successful missing confirmation updates stage and loss record', async()=>{
 const prev={targets:[{...source.targets[0],stage:'link_confirmed',verification:link}]};
 const data=await runCycle(source,prev,{check:async()=>({outcome:'missing',linkFound:false,checkedAt:'2026-10-29T20:00:00Z',lostAt:'2026-10-29T20:00:00Z'})});
 assert.equal(data.targets[0].stage,'lost');assert.equal(data.targets[0].verification.outcome,'missing');
});
test('new verified public link survives checkpoint recovery if inventory not yet updated', ()=>{
 const prev={targets:[{id:'c',name:'C',publishedUrl:'https://another.example/article',verification:link,stage:'link_confirmed'}]};
 const data=reconcile(source,prev);assert.equal(data.targets.length,3);assert.equal(data.targets[2].id,'c');
});
