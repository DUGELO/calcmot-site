const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
export function weights(versions) {
  if (!Array.isArray(versions) || !versions.length) throw new Error('Distribuição Cloudflare inválida.');
  const result = versions.filter(v => v.percentage !== 0).map(v => {
    if (!uuid.test(v.version_id ?? '') || typeof v.percentage !== 'number' || v.percentage <= 0 || v.percentage > 100) throw new Error('Versão Cloudflare inválida.');
    return { version_id:v.version_id, percentage:v.percentage };
  });
  if (Math.abs(result.reduce((sum,v)=>sum+v.percentage,0)-100) > 0.000001) throw new Error('Distribuição Cloudflare incompleta.');
  return result;
}
export function cloudflareClient(env, fetcher = fetch) {
  if (!/^[a-f0-9]{32}$/i.test(env.CLOUDFLARE_ACCOUNT_ID ?? '') || !env.CLOUDFLARE_API_TOKEN) throw new Error('Credencial de serviço Cloudflare não configurada.');
  const endpoint='https://api.cloudflare.com/client/v4/accounts/'+env.CLOUDFLARE_ACCOUNT_ID+'/workers/scripts/calcmot-site/deployments';
  async function call(method, body) {
    const response=await fetcher(endpoint,{method,headers:{Authorization:'Bearer '+env.CLOUDFLARE_API_TOKEN,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20_000)});
    const result=await response.json();
    if(!response.ok || result.success !== true) throw new Error('A operação de distribuição Cloudflare falhou.');
    return result.result;
  }
  return {
    async current() {
      const result=await call('GET');
      const latest=result.deployments?.slice().sort((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];
      if(!latest || !uuid.test(latest.id ?? ''))throw new Error('Distribuição atual não identificada; produção preservada.');
      return {id:latest.id,versions:weights(latest.versions)};
    },
    async switch(versions, message) {
      const result=await call('POST',{strategy:'percentage',versions:weights(versions),annotations:{'workers/message':message}});
      if(!uuid.test(result?.id ?? '')) throw new Error('A distribuição foi enviada, mas seu ID não foi confirmado.');
      // Creation acknowledges the deployment ID. GET and public smoke verify the delivered state.
      return {id:result.id};
    },
  };
}
export async function restoreIfOwned(client, previous, candidateId) {
  if(!candidateId)return;
  const current=await client.current();
  const normalized=value=>JSON.stringify(weights(value).sort((a,b)=>a.version_id.localeCompare(b.version_id)));
  if(normalized(current.versions)===normalized(previous.versions))return;
  if(current.versions.length!==1 || current.versions[0].version_id!==candidateId || current.versions[0].percentage!==100) throw new Error('Outra distribuição foi detectada. A reversão automática foi bloqueada para não sobrescrevê-la.');
  await client.switch(previous.versions,'Restore previous delivery after failed editorial verification');
}
