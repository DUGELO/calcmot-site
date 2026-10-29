export interface RideAnalysis {
  verdict: 'VALE A PENA' | 'VALE COM RESSALVAS' | 'NÃO VALE A PENA' | 'DADOS INSUFICIENTES';
  summary: string;
  diagnosis: string;
  insights: { finding: string; impact: string; action: string; confidence: 'CONFIRMADO' | 'ESTIMADO' | 'CONDICIONAL' }[];
  actions: string[];
  pricing: string;
  decision: string;
  questions: string[];
}

export function isRideAnalysis(value: unknown): value is RideAnalysis {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  const text = (item: unknown, max: number): item is string => typeof item === 'string' && item.trim().length > 0 && item.length <= max;
  const texts = (items: unknown, min: number, max: number, length: number): boolean => Array.isArray(items) && items.length >= min && items.length <= max && items.every(item => text(item, length));
  return ['VALE A PENA', 'VALE COM RESSALVAS', 'NÃO VALE A PENA', 'DADOS INSUFICIENTES'].includes(String(v['verdict']))
    && text(v['summary'], 700) && text(v['diagnosis'], 1800) && text(v['pricing'], 1000) && text(v['decision'], 700)
    && texts(v['actions'], 1, 3, 400) && texts(v['questions'], 0, 3, 300)
    && Array.isArray(v['insights']) && v['insights'].length >= 1 && v['insights'].length <= 5
    && v['insights'].every(item => item && text(item.finding, 300) && text(item.impact, 600) && text(item.action, 400) && ['CONFIRMADO', 'ESTIMADO', 'CONDICIONAL'].includes(item.confidence));
}
