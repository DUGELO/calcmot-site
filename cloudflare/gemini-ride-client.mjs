import { CALCMOT_RIDE_PROMPT, RIDE_ANALYSIS_SCHEMA, isRideAnalysis } from './ride-analysis-prompt.mjs';

export const DEFAULT_MODEL = 'gemini-3.8-flash';
const TOTAL_MS = 40000;
const ATTEMPT_MS = 12000;
const transient = new Set([408, 500, 502, 503, 504]);
const fail = (status, code, error, retryAfter) => ({ ok: false, status, code, error, ...(retryAfter ? { retryAfter } : {}) });
const busy = () => fail(503, 'AI_BUSY', 'A IA está ocupada agora. Tente de novo em instantes. Sua conta da corrida continua aqui.', 15);
const timeout = () => fail(504, 'AI_TIMEOUT', 'A IA demorou para responder. Tente novamente. Seus números foram preservados.', 15);
const configuration = () => fail(503, 'AI_CONFIGURATION', 'A ajuda com IA precisa de um ajuste no serviço. Você pode continuar usando a calculadora.');

function pause(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(signal.reason); return; }
    const onAbort = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', onAbort); resolve(); }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

function retrySeconds(value, now) {
  if (!value) return 0;
  const seconds = /^\d+$/.test(value) ? Number(value) : Math.ceil((Date.parse(value) - now) / 1000);
  return Number.isFinite(seconds) ? Math.max(0, Math.min(seconds, 86400)) : 0;
}

/** One user action: at most two primary calls and one explicitly configured fallback. */
export async function generateRideAnalysis(env, input, options = {}) {
  const { fetcher = globalThis.fetch, sleep = pause, now = Date.now, random = Math.random, signal, log = console.warn } = options;
  const primary = env.GEMINI_MODEL || DEFAULT_MODEL;
  const alternative = env.GEMINI_FALLBACK_MODEL || '';
  if (![primary, alternative].every(model => !model || /^[a-z0-9][a-z0-9.-]{0,79}$/.test(model))) return configuration();
  const models = [primary, primary, ...(alternative && alternative !== primary ? [alternative] : [])];
  const deadline = now() + TOTAL_MS;
  const overall = AbortSignal.any([AbortSignal.timeout(TOTAL_MS), ...(signal ? [signal] : [])]);
  let last = busy();
  let retryAfter = 0;
  for (let attempt = 0; attempt < models.length; attempt++) {
    if (overall.aborted || now() >= deadline) return signal?.aborted ? fail(499, 'AI_CANCELLED', 'Análise cancelada.') : timeout();
    if (attempt > 0) {
      const wait = Math.max(1000 * 2 ** (attempt - 1) + Math.floor(random() * 300), retryAfter * 1000);
      if (wait >= deadline - now()) return last;
      try { await sleep(wait, overall); } catch { return signal?.aborted ? fail(499, 'AI_CANCELLED', 'Análise cancelada.') : timeout(); }
    }
    if (overall.aborted || now() >= deadline) return signal?.aborted ? fail(499, 'AI_CANCELLED', 'Análise cancelada.') : timeout();
    const model = models[attempt];
    const thinking = /^gemini-3\.(8|6)-flash$/.test(model) ? { thinkingLevel: 'low' }
      : /^gemini-3\.(5|1)-flash-lite$/.test(model) ? { thinkingLevel: 'minimal' } : null;
    const attemptSignal = AbortSignal.any([overall, AbortSignal.timeout(Math.max(1, Math.min(ATTEMPT_MS, deadline - now())))]);
    retryAfter = 0;
    try {
      const response = await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST', signal: attemptSignal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: CALCMOT_RIDE_PROMPT }] },
          contents: [{ parts: [{ text: JSON.stringify(input) }] }],
          generationConfig: { maxOutputTokens: 6144, ...(thinking ? { thinkingConfig: thinking } : {}), responseMimeType: 'application/json', responseSchema: RIDE_ANALYSIS_SCHEMA },
        }),
      });
      if (!response.ok) {
        // Log codes only: never credentials, provider bodies, prompts, responses or IPs.
        log(JSON.stringify({ event: 'ride_ai_failure', model, attempt: attempt + 1, upstreamStatus: response.status }));
        retryAfter = retrySeconds(response.headers.get('Retry-After'), now());
        if (response.body) await response.body.cancel().catch(() => {});
        if (response.status === 429) return fail(429, 'AI_PROVIDER_LIMIT', 'O serviço de IA atingiu um limite de uso. Aguarde um pouco e tente novamente. A calculadora continua funcionando.', retryAfter || 60);
        if ([400, 401, 402, 403, 404].includes(response.status)) return configuration();
        if (!transient.has(response.status)) return fail(502, 'AI_PROVIDER_ERROR', 'Não foi possível receber a análise. Tente novamente mais tarde.');
        last = response.status === 408 || response.status === 504 ? timeout() : busy();
        if (retryAfter) last = { ...last, retryAfter };
        continue;
      }
      let data;
      try { data = await response.json(); }
      catch (error) {
        if (attemptSignal.aborted) throw error;
        return fail(502, 'AI_INVALID_RESPONSE', 'A IA não concluiu uma resposta válida. Tente novamente.');
      }
      const candidate = data?.candidates?.[0];
      if (data?.promptFeedback?.blockReason || ['SAFETY', 'RECITATION', 'BLOCKLIST', 'PROHIBITED_CONTENT'].includes(candidate?.finishReason)) {
        return fail(422, 'AI_CONTENT_BLOCKED', 'A IA não conseguiu analisar esse texto. Conte apenas os detalhes da corrida, sem dados pessoais.');
      }
      if (candidate?.finishReason !== 'STOP') return fail(502, 'AI_INVALID_RESPONSE', 'A resposta da IA veio incompleta. Tente contar o caso de forma mais curta.');
      let analysis;
      try { analysis = JSON.parse(candidate.content.parts.filter(part => !part.thought).map(part => part.text || '').join('')); }
      catch { return fail(502, 'AI_INVALID_RESPONSE', 'A IA não concluiu uma resposta válida. Tente novamente.'); }
      if (!isRideAnalysis(analysis)) return fail(502, 'AI_INVALID_RESPONSE', 'A IA não concluiu uma resposta válida. Tente novamente.');
      if (overall.aborted || now() >= deadline) return signal?.aborted ? fail(499, 'AI_CANCELLED', 'Análise cancelada.') : timeout();
      const { verdict, summary, diagnosis, insights, actions, pricing, decision, questions } = analysis;
      return { ok: true, analysis: { verdict, summary, diagnosis, insights, actions, pricing, decision, questions } };
    } catch (error) {
      if (signal?.aborted) return fail(499, 'AI_CANCELLED', 'Análise cancelada.');
      last = attemptSignal.aborted || error?.name === 'TimeoutError' ? timeout() : fail(502, 'AI_NETWORK', 'A conexão com a IA falhou. Tente novamente. Sua conta foi preservada.', 15);
      log(JSON.stringify({ event: 'ride_ai_failure', model, attempt: attempt + 1, code: last.code }));
    }
  }
  return last;
}
