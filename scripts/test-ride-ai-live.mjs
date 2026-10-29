import assert from 'node:assert/strict';
import { withRideInsights } from '../cloudflare/ride-insights.mjs';
// Opt-in only. Never save a credential or print request headers/provider error bodies.
if (!process.env.GEMINI_API_KEY) throw new Error('Defina GEMINI_API_KEY somente no ambiente do processo.');
const handler=withRideInsights({fetch:()=>new Response('not found',{status:404})});
const originalFetch=globalThis.fetch;
globalThis.fetch=async (...args)=>{
  let response;
  try { response=await originalFetch(...args); }
  catch(error){console.log('Falha de transporte:',error.name,/^[A-Z_]{1,80}$/.test(error.cause?.code||'')?error.cause.code:'sem código');throw error;}
  if(!response.ok){
    const error=await response.clone().json().catch(()=>({}));
    const reason=error.error?.details?.map(detail=>detail.reason).find(value=>typeof value==='string' && /^[A-Z_]{1,80}$/.test(value));
    console.log('Gemini HTTP:',response.status,'status:',/^[A-Z_]{1,80}$/.test(error.error?.status||'')?error.error.status:'indisponível','reason:',reason||'indisponível');
  }
  return response;
};
const request=new Request('https://calcmot.com.br/api/tools/ride-insights',{
  method:'POST',headers:{Origin:'https://calcmot.com.br','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1'},
  body:JSON.stringify({inputs:{fare:'60',tripKm:'40',tripMinutes:'60',pickupKm:'0',pickupMinutes:'0',costPerKm:'0,75'},context:'É um serviço particular. O custo de R$ 0,75/km já inclui combustível e manutenção. Além dos 40 km e 60 min dos campos, vou retornar 40 km vazio em 60 min e esperar mais 30 min, sem cobrar a mais. Minha meta é sobrar R$ 30/h após esses custos. Não há pedágio nem outras despesas neste cenário. Vale aceitar por R$ 60? Qual o mínimo para minha meta?'}),
});
const response=await handler.fetch(request,{GEMINI_API_KEY:process.env.GEMINI_API_KEY,GEMINI_MODEL:process.env.GEMINI_MODEL,RIDE_AI_LIMITER:{limit:async()=>({success:true})}});
globalThis.fetch=originalFetch;
console.log('HTTP da análise:',response.status);
const result=await response.json();
if(!response.ok){console.log(result.error);process.exitCode=1;}
else{
  console.log(JSON.stringify(result,null,2));
  assert.equal(result.verdict,'NÃO VALE A PENA','A meta explícita não é atendida: 80 km custam R$ 60 e 2,5 horas exigem R$ 75 de remuneração. Mínimo R$ 135.');
  console.log('Veredito do cenário controlado OK. Revisar contas: custo R$ 60, tempo 2,5 h e mínimo R$ 135.');
}
