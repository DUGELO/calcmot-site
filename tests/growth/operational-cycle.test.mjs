import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
async function cleanup(dir){const root=path.resolve(os.tmpdir())+path.sep;assert.ok(path.resolve(dir).startsWith(root)&&path.basename(dir).startsWith('growth-'));await fs.rm(dir,{recursive:true,force:true});}
import {initialState,key,save,load,enqueue,recover,claim,settle,executeOnce} from '../../scripts/growth/persistence.mjs';
import {runOperationalCycle,discover} from '../../scripts/growth/cycle.mjs';
test('checkpoint roundtrip, idempotent tasks, leases and backoff recover safely',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'growth-safe-'));const file=path.join(dir,'state.json');
 try{const s=initialState();enqueue(s,'qualification','a');enqueue(s,'qualification','a');assert.equal(s.tasks.length,1);
 const task=claim(s,100);assert.equal(task.attempts,1);recover(s,300000);assert.equal(task.status,'pending');settle(task,false,300000);assert.ok(task.nextAt>300000);
 await save(file,s);assert.equal((await load(file)).tasks.length,1);
 }finally{await cleanup(dir);}
});
test('persisted external intent prevents duplicate writes and unknown outcome cannot retry',async()=>{
 const s=initialState();let sends=0,saves=0;
 const opts={actionKey:key('directory','example.com'),approval:{reviewed:true,cost:0,evidenceUrl:'https://example.com/rules'},adapter:{approved:true,free:true,send:async()=>{sends++;throw Error('connection closed after send');}},payload:{}};
 assert.equal(await executeOnce(s,opts,async()=>{saves++;}),'unknown_outcome');
 assert.equal(await executeOnce(s,opts,async()=>{saves++;}),'manual');assert.equal(sends,1);assert.equal(saves,2);
 s.intents.push({id:'interrupted',status:'pending'});recover(s,1);assert.equal(s.intents.at(-1).status,'unknown_outcome');
});
test('failed verification and blocked qualification do not stop independent discovery or checkpoints',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'growth-cycle-'));const statePath=path.join(dir,'state.json');
 const now=Date.now(),stamp=new Date(now).toISOString();
 const inventory={targets:[{id:'link',name:'Link',submitUrl:'https://example.com/submit',publishedUrl:'https://example.com/page',verification:{outcome:'present',linkFound:true,httpStatus:200,checkedAt:stamp,finalUrl:'https://example.com/page',referringDomain:'example.com'}},{id:'lead',name:'Lead',submitUrl:'https://other.com',stage:'discovered'}]};
 const fetchPage=async url=>url.includes('/readme')?{status:200,url,headers:{},body:JSON.stringify({encoding:'base64',content:Buffer.from('[Listing](https://directory.org)').toString('base64')})}:{status:402,url,headers:{'content-type':'text/html'},body:''};
 try{const {state,result}=await runOperationalCycle({inventory,statePath,now,fetchPage,sources:['https://api.github.com/repos/maxlibin/free-directory-submissions/readme']});
 assert.ok(state.targets.some(t=>t.submitUrl==='https://directory.org'));assert.equal(state.lastRun.externalWrites,0);assert.equal(result.currentVerifiedLinks,0);assert.equal(result.lastKnownVerifiedLinks,1);assert.equal((await load(statePath)).version,2);
 const resumed=await runOperationalCycle({inventory,previous:state,statePath,now,fetchPage,sources:[]});
 assert.equal(new Set(resumed.state.tasks.map(t=>t.id)).size,resumed.state.tasks.length);
 }finally{await cleanup(dir);}
});
test('discovery data remains unqualified and is not executable instructions',()=>{
 const leads=discover(JSON.stringify({encoding:'base64',content:Buffer.from('[An app](https://example.com)').toString('base64')}),'https://api.github.com/source','2026-11-05');
 assert.equal(leads[0].eligibility,'unknown');assert.equal(leads[0].cost,'unknown');assert.equal(leads[0].stage,'discovered');
});
