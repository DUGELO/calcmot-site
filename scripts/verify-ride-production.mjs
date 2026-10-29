import assert from 'node:assert/strict';
import { isRideAnalysis } from '../cloudflare/ride-analysis-prompt.mjs';

const base='https://calcmot.com.br';
for(const path of ['/', '/como-funciona/', '/calculadora-ganhos-motorista-app/', '/ferramentas/corrida-vale-a-pena/', '/privacidade/', '/suporte/']){
  const response=await fetch(base+path,{signal:AbortSignal.timeout(20000)});
  assert.equal(response.status,200,path);
  const html=await response.text();
  assert.match(html,/<h1(?:\s|>)/,path);
  assert.match(html,/rel="canonical"/,path);
  if(path.includes('corrida-vale-a-pena')){
    assert.ok(html.includes('Essa corrida vale a pena?'));
    assert.ok(html.includes('Quanto cobrar numa corrida particular?'));
  }
  console.log(`Público OK: ${path}`);
}
const admin=await fetch(base+'/admin',{signal:AbortSignal.timeout(20000)});
assert.equal(admin.status,200);
assert.equal(admin.headers.get('X-CalcMot-Environment'),'PROD');
assert.ok(admin.headers.get('Cache-Control').includes('no-store'));
assert.ok(admin.headers.get('X-Robots-Tag').includes('noindex'));
console.log('Admin preservado: PROD, no-store, noindex.');
const session=await fetch(base+'/api/admin/v1/session',{headers:{Origin:base,'X-CalcMot-Admin':'1'},signal:AbortSignal.timeout(20000)});
assert.equal(session.status,401);
assert.equal(session.headers.get('X-CalcMot-Environment'),'PROD');
console.log('Sessão administrativa anônima: 401/PROD.');
const analysis=await fetch(base+'/api/tools/ride-insights',{
  method:'POST',headers:{Origin:base,'Content-Type':'application/json'},signal:AbortSignal.timeout(40000),
  body:JSON.stringify({inputs:{fare:'60',tripKm:'40',tripMinutes:'60',pickupKm:'0',pickupMinutes:'0',costPerKm:'0,75'},context:'É serviço particular. Vou voltar os mesmos 40 km vazio em mais 60 min e esperar 30 min, além do trajeto informado. O custo por km já inclui combustível e manutenção. Minha meta é sobrar R$ 30/h após custos. Não há pedágios nem outros custos neste cenário. Vale aceitar por R$ 60?'}),
});
console.log('Análise publicada HTTP:',analysis.status);
const result=await analysis.json();
if(!analysis.ok){console.log(result.error||'Resposta indisponível');process.exitCode=1;}
else{
  assert.ok(isRideAnalysis(result),'Contrato da resposta da IA');
  assert.equal(analysis.headers.get('Cache-Control'),'no-store');
  console.log(JSON.stringify(result,null,2));
  console.log('Análise real no domínio validada.');
}
