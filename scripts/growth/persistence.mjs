import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
export const key=(...parts)=>createHash('sha256').update(JSON.stringify(parts)).digest('hex');
export const limits=Object.freeze({tasks:12,requests:20,runtimeMs:180000,attempts:3,leaseMs:240000});
export function initialState(){return {version:2,targets:[],tasks:[],intents:[],manual:[],runs:[]};}
export function validate(s){
 if(s.version!==2||!['targets','tasks','intents','manual','runs'].every(k=>Array.isArray(s[k])))throw Error('Invalid checkpoint schema');
 for(const field of ['targets','tasks','intents','manual'])if(new Set(s[field].map(x=>x.id)).size!==s[field].length)throw Error('Duplicate checkpoint identity');
 if(s.targets.length>5000||s.tasks.length>20000||s.intents.length>10000)throw Error('Checkpoint capacity limit');
 return s;
}
export async function load(file){try{return validate(JSON.parse((await fs.readFile(file,'utf8')).replace(/^\uFEFF/,'')));}catch(e){if(e.code==='ENOENT')return initialState();throw e;}}
export async function save(file,state){validate(state);await fs.mkdir(path.dirname(file),{recursive:true});const tmp=file+'.'+process.pid+'.tmp';await fs.writeFile(tmp,JSON.stringify(state,null,2)+'\n');await fs.rename(tmp,file);}
export async function lock(file,now=Date.now()){
 await fs.mkdir(path.dirname(file),{recursive:true});const owner=randomUUID(),name=file+'.lock';
 try{await fs.writeFile(name,JSON.stringify({owner,expiresAt:now+600000}),{flag:'wx'});}
 catch(e){if(e.code!=='EEXIST')throw e;const prior=JSON.parse(await fs.readFile(name,'utf8'));if(!Number.isFinite(prior.expiresAt)||prior.expiresAt>now)throw Error('Cycle already active');await fs.unlink(name);await fs.writeFile(name,JSON.stringify({owner,expiresAt:now+600000}),{flag:'wx'});}
 return async()=>{const value=JSON.parse(await fs.readFile(name,'utf8'));if(value.owner===owner)await fs.unlink(name);};
}
export function recover(s,now){
 for(const i of s.intents)if(i.status==='pending')i.status='unknown_outcome';
 for(const t of s.tasks)if(t.status==='leased'&&t.leaseUntil<=now){t.status=t.kind==='execution'?'manual':'pending';delete t.leaseUntil;}
}
export function enqueue(s,kind,subject,revision='1'){const id=key(kind,subject,revision);if(!s.tasks.some(t=>t.id===id))s.tasks.push({id,kind,subject,status:'pending',attempts:0,nextAt:0});}
export function claim(s,now,allowed=()=>true){
 const rank={verification:0,discovery:1,qualification:2,execution:3};
 const t=s.tasks.filter(t=>t.status==='pending'&&t.nextAt<=now&&t.attempts<limits.attempts&&allowed(t)).sort((a,b)=>(rank[a.kind]??9)-(rank[b.kind]??9))[0];
 if(t){Object.assign(t,{status:'leased',attempts:t.attempts+1,leaseUntil:now+limits.leaseMs});}return t;
}
export function settle(t,ok,now){t.status=ok?'done':t.attempts>=limits.attempts?'exhausted':'pending';t.nextAt=ok?0:now+Math.min(86400000,60000*2**t.attempts);delete t.leaseUntil;}
export async function executeOnce(s,{actionKey,approval,adapter,payload},checkpoint){
 if(!actionKey||s.intents.some(i=>i.id===actionKey))return 'manual';
 if(!approval?.reviewed||approval.cost!==0||!approval.evidenceUrl||!adapter?.approved||adapter.free!==true)return 'manual';
 const intent={id:actionKey,status:'pending'};s.intents.push(intent);await checkpoint();
 try{const r=await adapter.send(payload,{idempotencyKey:actionKey});intent.status=r?.confirmed&&r?.receiptUrl?'confirmed':'unknown_outcome';if(intent.status==='confirmed')intent.receiptUrl=r.receiptUrl;}catch{intent.status='unknown_outcome';}
 await checkpoint();return intent.status;
}
