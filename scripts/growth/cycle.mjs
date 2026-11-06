import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {registrableDomain,hostname} from './domains.mjs';
import {fetchPublic} from './network.mjs';
import {verifyBacklink} from './verify.mjs';
import {normalizeUrl} from './model.mjs';
import {reconcile} from './persistent-cycle.mjs';
import {report,markdown} from './report.mjs';
import {limits,key,initialState,validate,save,lock,recover,enqueue,claim,settle} from './persistence.mjs';
// Read-only public curated directory source, not a search-engine scrape.
const domainKey=url=>registrableDomain(url)||hostname(url);
const sameDomain=(a,b)=>domainKey(a)&&domainKey(a)===domainKey(b);
export const SOURCES=['https://api.github.com/repos/maxlibin/free-directory-submissions/readme'];
export function discover(body,source,checkedAt){
 const parsed=JSON.parse(body);if(parsed.encoding!=='base64'||typeof parsed.content!=='string')throw Error('Unexpected directory source');
 const markdown=Buffer.from(parsed.content,'base64').toString('utf8');
 return [...markdown.matchAll(/\[([^\]\n]{1,100})\]\((https:\/\/[^\s)]+)\)/g)].slice(0,500).flatMap(([,name,value])=>{
  try{const url=normalizeUrl(value),u=new URL(url);if(['github.com','raw.githubusercontent.com'].includes(u.hostname))return [];
   return [{id:key('lead',url),name,submitUrl:url,stage:'discovered',submissionStatus:'not_sent',eligibility:'unknown',cost:'unknown',discoveryEvidence:{url:source,checkedAt,note:'Curated directory lead only; eligibility, relevance and free path need review.'}}];
  }catch{return [];}
 });
}
export async function runOperationalCycle({inventory,previous,ledger={events:[]},statePath,fetchPage=fetchPublic,sources=SOURCES,now=Date.now(),seedCandidates=[]}){
 const release=await lock(statePath);const started=Date.now(),stamp=new Date(now).toISOString(),day=stamp.slice(0,10);
 try{
  const state=previous?.version===2?validate(structuredClone(previous)):initialState();
  const merged=reconcile(inventory,previous);
  for(const t of merged.targets){const i=state.targets.findIndex(x=>x.id===t.id);if(i<0)state.targets.push(t);else if(state.targets[i].publishedUrl!==t.publishedUrl)state.targets[i]=t;else state.targets[i]={...t,verification:state.targets[i].verification??t.verification,lastAttempt:state.targets[i].lastAttempt??t.lastAttempt};}
  recover(state,now);
  for(const e of ledger.events||[])if(e.submissionConfirmed){const id=key('already-sent',e.opportunityId);if(!state.intents.some(x=>x.id===id))state.intents.push({id,targetId:e.opportunityId,status:'confirmed',evidence:e.evidence});}
  for(const c of seedCandidates.slice(0,500)){try{const url=normalizeUrl(c.url);if(!state.targets.some(t=>sameDomain(t.submitUrl,url))&&state.targets.length<5000)state.targets.push({id:key('lead',url),name:c.name,submitUrl:url,stage:'discovered',submissionStatus:'not_sent',eligibility:'unknown',cost:'unknown',discoveryEvidence:{url:c.discovery_source,checkedAt:day,note:'Seed candidate; review required.'}});}catch{}}
  const firstByDomain=new Map();
  for(const target of state.targets){const domain=domainKey(target.submitUrl);if(!domain)continue;if(firstByDomain.has(domain)&&target.stage==='discovered')target.duplicateOf=firstByDomain.get(domain);else if(!firstByDomain.has(domain))firstByDomain.set(domain,target.id);}
  for(const task of state.tasks){const target=state.targets.find(t=>t.id===task.subject);if(target?.duplicateOf&&task.kind!=='verification'&&task.status==='pending'){task.status='manual';task.error='Duplicate referring domain; preserve source and review primary candidate.';}}
  for(const source of sources)enqueue(state,'discovery',source,day);
  for(const t of state.targets){
   if(t.publishedUrl&&!state.tasks.some(x=>x.kind==='verification'&&x.subject===t.id&&['pending','leased'].includes(x.status)))enqueue(state,'verification',t.id,day);
   if(!t.qualification?.eligible&&!t.publishedUrl)enqueue(state,'qualification',t.id,'rules-v1');
   if(['qualified','drafted'].includes(t.stage)&&!state.intents.some(x=>x.targetId===t.id))enqueue(state,'execution',t.id);
  }
  const checkpoint=()=>save(statePath,state);await checkpoint();
  let requests=0,tasks=0;const phases={recovery:1,discovery:0,qualification:0,execution:0,verification:0,reporting:0};
  const caps={discovery:2,qualification:4,execution:3,verification:3};
  const boundedFetch=async(url,options={})=>{
   if(++requests>limits.requests||Date.now()-started>limits.runtimeMs)throw Error('Cycle resource cap');
   return fetchPage(url,{accept:options.accept,timeoutMs:5000,maxRedirects:3,maxBytes:Math.min(options.maxBytes??1048576,8388608)});
  };
  while(tasks<limits.tasks&&requests<limits.requests&&Date.now()-started<limits.runtimeMs){
   const t=claim(state,now,x=>(phases[x.kind]??0)<(caps[x.kind]??0));if(!t)break;
   tasks++;phases[t.kind]++;await checkpoint();
   try{
    const target=state.targets.find(x=>x.id===t.subject);
    if(t.kind==='discovery'){
     if(!sources.includes(t.subject))throw Error('Source not allowlisted');
     const page=await boundedFetch(t.subject,{accept:'application/vnd.github+json'});if(page.status!==200)throw Error('Discovery HTTP '+page.status);
     for(const lead of discover(page.body,t.subject,stamp))if(state.targets.length<5000&&!state.targets.some(x=>sameDomain(x.submitUrl,lead.submitUrl))){state.targets.push(lead);enqueue(state,'qualification',lead.id,'rules-v1');}
    }else if(t.kind==='qualification'){
     const page=await boundedFetch(target.submitUrl);
     if(page.status===429||page.status>=500||page.status===402)throw Error('Temporary qualification HTTP '+page.status);
     const body=page.body.slice(0,100000);target.triage={checkedAt:stamp,httpStatus:page.status,loginMention:/log[ -]?in|sign[ -]?in/i.test(body),captchaMention:/captcha/i.test(body),paymentMention:/pricing|payment|paid/i.test(body),automationRestrictionMention:/do not submit.*automat|no automated submission/i.test(body),eligible:null,requiresHumanReview:true};
     if(!state.manual.some(x=>x.id===target.id))state.manual.push({id:target.id,kind:'qualification',reason:'Rules, topic, free path and permission require review; regex signals do not establish eligibility.'});
    }else if(t.kind==='execution'){
     // No external write adapters enabled in Actions. The authorized desktop agent executes reviewed channels.
     if(!state.manual.some(x=>x.id===target.id))state.manual.push({id:target.id,kind:'execution',reason:'Requires reviewed platform rules and authorized browser/MCP; check ledger before any send.'});
    }else if(t.kind==='verification'){
     const attempt=await verifyBacklink(target.publishedUrl,{fetchPage:url=>boundedFetch(url,{maxBytes:target.verificationMaxBytes}),previous:target.verification,now:stamp});
     target.lastAttempt={outcome:attempt.outcome,error:attempt.error,checkedAt:stamp};
     if(attempt.outcome==='temporary_error')throw Error(attempt.error||'Temporary verification failure');
     target.verification=attempt;target.stage=attempt.linkFound?'link_confirmed':attempt.lostAt?'lost':'published';
    }
    settle(t,true,now);delete t.error;
   }catch(error){settle(t,false,now);t.error=String(error.message).slice(0,250);}
   await checkpoint();
  }
  phases.reporting=1;const result=report({targets:state.targets},ledger);
  state.lastRun={at:stamp,phases,tasks,requests,externalWrites:0,costBRL:0};
  state.summary={goalDomains:100,currentDomains:result.currentReferringDomains,lastKnownDomains:result.referringDomains,missionComplete:result.currentReferringDomains>=100,manual:state.manual.length,pending:state.tasks.filter(t=>t.status==='pending').length,unknownOutcomes:state.intents.filter(i=>i.status==='unknown_outcome').length};
  state.runs=[...state.runs,state.lastRun].slice(-100);await checkpoint();return {state,result};
 }finally{await release();}
}
async function main(){
 const [inventoryPath,priorPath,statePath,reportPath]=process.argv.slice(2);if(!reportPath)throw Error('Usage: cycle.mjs inventory previous-checkpoint state-output report');
 const read=async p=>JSON.parse((await fs.readFile(p,'utf8')).replace(/^\uFEFF/,''));
 const inventory=await read(inventoryPath);let previous;try{previous=await read(priorPath);}catch(e){if(e.code!=='ENOENT')throw e;try{previous=await read('docs/growth/seed-checkpoint.json');}catch(seedError){if(seedError.code!=='ENOENT')throw seedError;}}
 const ledger=await read('docs/growth/execution-log.json');const candidates=await read('docs/growth/candidates.json');
 const {state,result}=await runOperationalCycle({inventory,previous,ledger,statePath,seedCandidates:candidates.candidates});
 await fs.writeFile(reportPath,markdown(result)+'\n\n## Operação limitada\n'+JSON.stringify({lastRun:state.lastRun,summary:state.summary},null,2)+'\n');
 await fs.writeFile(reportPath.replace(/\.md$/,'')+'.json',JSON.stringify({...result,operation:state.lastRun,mission:state.summary},null,2)+'\n');
 console.log(JSON.stringify({lastRun:state.lastRun,summary:state.summary}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
