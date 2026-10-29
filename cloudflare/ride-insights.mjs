import { CALCMOT_RIDE_PROMPT, RIDE_ANALYSIS_SCHEMA, isRideAnalysis } from './ride-analysis-prompt.mjs';

const PATH = '/api/tools/ride-insights';
const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'X-Content-Type-Options': 'nosniff' };
const reply = (status, data) => Response.json(data, { status, headers });
const fields = ['fare', 'pickupKm', 'tripKm', 'tripMinutes', 'pickupMinutes', 'costPerKm'];
const goals = {
  general: 'Avaliar se a oferta compensa nas condições informadas.',
  return: 'Priorizar o impacto de retorno vazio, espera e despesas extras, separando o cenário-base das hipóteses.',
  hourly: 'Priorizar a comparação com a meta horária informada, distinguindo receita bruta de remuneração após custos. Se faltar a meta, perguntar.',
  private: 'Avaliar orçamento de serviço particular. Confirmar que é serviço particular antes de sugerir negociação; calcular mínimo apenas com custos, tempo e meta suficientes.',
};

export function withRideInsights(handler) {
  return {
    async fetch(request, env, context) {
      const url = new URL(request.url);
      if (url.pathname !== PATH) return handler.fetch(request, env, context);
      if (request.method !== 'POST') return reply(405, { error: 'Método não permitido.' });
      if (request.headers.get('Origin') !== url.origin) return reply(403, { error: 'Origem inválida.' });
      if (!env.GEMINI_API_KEY || !env.RIDE_AI_LIMITER) return reply(503, { error: 'A análise com IA ainda não está disponível. Seu cálculo continua funcionando.' });
      const ip = request.headers.get('CF-Connecting-IP');
      if (!ip) return reply(403, { error: 'Não foi possível validar a solicitação.' });
      let allowed;
      try { allowed = await env.RIDE_AI_LIMITER.limit({ key: ip }); }
      catch { return reply(503, { error: 'A análise está temporariamente indisponível.' }); }
      if (!allowed.success) return reply(429, { error: 'Limite de análises atingido. Aguarde um minuto e tente novamente.' });
      if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply(415, { error: 'Formato inválido.' });
      // Bound streamed bodies as well as requests declaring Content-Length.
      const reader = request.body?.getReader();
      if (!reader) return reply(400, { error: 'Informe os dados da corrida.' });
      let size = 0;
      let raw = '';
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 8192) { await reader.cancel(); return reply(413, { error: 'Texto muito longo.' }); }
        raw += decoder.decode(value, { stream: true });
      }
      let body;
      try { body = JSON.parse(raw + decoder.decode()); } catch { return reply(400, { error: 'Dados inválidos.' }); }
      if (!body || typeof body.context !== 'string' || body.context.trim().length < 10 || body.context.length > 1500 || !body.inputs) return reply(400, { error: 'Descreva o contexto em 10 a 1.500 caracteres.' });
      const goal=body.goal ?? 'general';
      if(typeof goal !== 'string' || !Object.hasOwn(goals,goal))return reply(400,{error:'Selecione um objetivo de análise válido.'});
      const values = {};
      for (const field of fields) {
        const value = body.inputs[field];
        if (typeof value !== 'string' || value.length > 20 || (value.trim() && !/^\d+(?:[,.]\d{1,3})?$/.test(value.trim()))) return reply(400, { error: 'Valores da corrida inválidos.' });
        if (field === 'fare' && !/^\d+(?:[,.]\d{1,2})?$/.test(value.trim())) return reply(400, { error: 'Valor da oferta inválido.' });
        values[field] = Number(value.trim().replace(',', '.') || 0);
      }
      const { fare, tripKm, pickupKm, tripMinutes, pickupMinutes, costPerKm } = values;
      const km = tripKm + pickupKm, minutes = tripMinutes + pickupMinutes;
      if (fare <= 0 || fare > 10000 || tripKm <= 0 || km > 1000 || tripMinutes <= 0 || minutes > 1440 || !Number.isInteger(tripMinutes) || !Number.isInteger(pickupMinutes) || costPerKm > 100) return reply(400, { error: 'Valores fora dos limites.' });
      // Match the browser calculator's integer units, including half-cent rounding.
      const units=(raw,decimals)=>{const [whole,fraction='']=raw.trim().replace(',','.').split('.');return Number(whole||0)*10**decimals+Number(fraction.padEnd(decimals,'0'));};
      const fareCents=units(body.inputs.fare,2);
      const totalMeters=units(body.inputs.tripKm,3)+units(body.inputs.pickupKm,3);
      const costCents=body.inputs.costPerKm.trim()?Math.round(totalMeters*units(body.inputs.costPerKm,3)/10000):null;
      const facts = { receita: fareCents/100, kmTotal: totalMeters/1000, minutosTotal: minutes, receitaPorKm: Math.round(fareCents*1000/totalMeters)/100, receitaPorHora: Math.round(fareCents*60/minutes)/100, custo: costCents===null?null:costCents/100, saldo: costCents===null?null:(fareCents-costCents)/100 };
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL || 'gemini-flash-latest'}:generateContent`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY }, signal: AbortSignal.timeout(30000),
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: CALCMOT_RIDE_PROMPT }] },
            contents: [{ parts: [{ text: JSON.stringify({ objetivoDaAnalise: goals[goal], fatos: facts, camposInformados: values, custoPorKmInformado: Boolean(body.inputs.costPerKm.trim()), contextoDoMotorista: body.context.trim() }) }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 6144, responseMimeType: 'application/json', responseSchema: RIDE_ANALYSIS_SCHEMA },
          }),
        });
        if (!response.ok) return reply(502, { error: 'O Gemini está indisponível. Tente novamente mais tarde.' });
        const data = await response.json();
        const candidate = data.candidates?.[0];
        if (candidate?.finishReason !== 'STOP') throw new Error('Incomplete response');
        const result = JSON.parse(candidate.content.parts.filter(part => !part.thought).map(part => part.text || '').join(''));
        if (!isRideAnalysis(result)) throw new Error('Invalid response');
        const { verdict, summary, diagnosis, insights, actions, pricing, decision, questions } = result;
        return reply(200, { verdict, summary, diagnosis, insights, actions, pricing, decision, questions });
      } catch { return reply(502, { error: 'Não foi possível concluir a análise. Tente novamente. Seu cálculo foi preservado.' }); }
    },
  };
}
