#!/usr/bin/env node
/**
 * Cadastro idempotente de dimensões GA4 para a propriedade WEB Site CalcMot.
 * Uso:
 *   node scripts/ga4-register-custom-dimensions.mjs --plan
 *   GA4_ADMIN_ACCESS_TOKEN=... node scripts/ga4-register-custom-dimensions.mjs --check
 *   GA4_ADMIN_ACCESS_TOKEN=... node scripts/ga4-register-custom-dimensions.mjs --apply
 * O token deve ter escopo analytics.edit e o principal deve ser Editor/Admin.
 * Nunca grave tokens no repositório e nunca execute --apply no CI.
 */
const property = process.env.GA4_PROPERTY_ID || '557155341';
const mode = process.argv.includes('--apply') ? 'apply'
  : process.argv.includes('--check') ? 'check' : 'plan';
if (!/^\d+$/.test(property)) throw Error('GA4_PROPERTY_ID inválido');
if (property !== '557155341' && process.env.GA4_ALLOW_OTHER_PROPERTY !== 'YES') {
  throw Error('Esta rotina é restrita à propriedade Site CalcMot 557155341');
}
const dimensions = [
  { parameterName:'source_page', displayName:'Source page',
    description:'Página ou grupo de origem categórico; não contém URL nem identificadores pessoais.' },
  { parameterName:'link_placement', displayName:'Link placement',
    description:'Posição categórica do CTA de calculadora ou Play Store.' },
  { parameterName:'entry_type', displayName:'Entry type',
    description:'Tipo de entrada na calculadora: internal, external ou direct.' },
];
if (mode === 'plan') {
  console.log(JSON.stringify({ property, mode, dimensions:dimensions.map(d=>d.parameterName) }, null, 2));
  process.exit(0);
}
const token = process.env.GA4_ADMIN_ACCESS_TOKEN;
if (!token) throw Error('Defina GA4_ADMIN_ACCESS_TOKEN (OAuth com analytics.edit). Nunca faça commit do token.');
const endpoint = `https://analyticsadmin.googleapis.com/v1beta/properties/${property}/customDimensions`;
async function api(url, init={}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization:`Bearer ${token}`,
      Accept:'application/json',
      ...(init.body ? {'Content-Type':'application/json'} : {}),
    },
  });
  const body = await response.json().catch(()=>({}));
  if (!response.ok) {
    throw Error(`GA4 Admin API HTTP ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}
async function listDimensions() {
  const found=[];
  let pageToken;
  do {
    const url = new URL(endpoint);
    url.searchParams.set('pageSize','200');
    if (pageToken) url.searchParams.set('pageToken',pageToken);
    const data = await api(url.toString());
    found.push(...(data.customDimensions || []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return found;
}
const existing = await listDimensions();
for (const d of dimensions) {
  const matches=existing.filter(x=>x.parameterName===d.parameterName);
  if (matches.length>1) throw Error(`Definições duplicadas: ${d.parameterName}`);
  if (matches.length===1) {
    if (matches[0].scope!=='EVENT') throw Error(`Escopo incompatível para ${d.parameterName}: ${matches[0].scope}`);
    console.log(`EXISTE: ${d.parameterName} (${matches[0].name})`);
    continue;
  }
  if (mode==='check') {
    console.log(`A CRIAR: ${d.parameterName}`);
    continue;
  }
  const created=await api(endpoint,{method:'POST',body:JSON.stringify({...d,scope:'EVENT'})});
  console.log(`CRIADA: ${d.parameterName} (${created.name})`);
}
console.log(mode==='apply'?'Cadastro concluído; valide o processamento no GA4.':'Inspeção concluída; nenhum dado foi alterado.');
