/** Grupos fechados para análise sem enviar URLs, queries ou dados do motorista. */
export type PageGroup =
  | 'home' | 'ride_calculator' | 'app_calculator' | 'how_it_works'
  | 'privacy' | 'support' | 'other_internal' | 'external' | 'direct';

export type TrafficEntry = 'internal' | 'external' | 'direct';
export type TrackedDestination = 'ride_calculator' | 'play_store';

const TOOL_PATH = '/ferramentas/corrida-vale-a-pena';
const SITE_HOSTS = new Set(['calcmot.com.br', 'www.calcmot.com.br']);
const PLACEMENTS = new Set([
  'header_desktop', 'header_mobile', 'header_cta', 'footer_nav', 'footer_play',
  'home_hero', 'home_hero_cta', 'home_comparison', 'app_page_hero', 'app_page_play',
  'calculator_result', 'calculator_real_offer', 'cta_band', 'other_link',
]);
const PAGES = new Set<PageGroup>([
  'home','ride_calculator','app_calculator','how_it_works','privacy','support',
  'other_internal','external','direct',
]);

export function canonicalPath(path: string): string {
  const withoutTrailingSlash = path.replace(/\/+$/, '');
  return withoutTrailingSlash || '/';
}

export function pageGroup(path: string): PageGroup {
  switch (canonicalPath(path)) {
    case '/': return 'home';
    case TOOL_PATH: return 'ride_calculator';
    case '/calculadora-ganhos-motorista-app': return 'app_calculator';
    case '/como-funciona': return 'how_it_works';
    case '/privacidade': return 'privacy';
    case '/suporte': return 'support';
    default: return 'other_internal';
  }
}

export function safePlacement(value: string | null): string {
  return value && PLACEMENTS.has(value) ? value : 'other_link';
}

function internalDestination(url: URL, current: URL): boolean {
  return url.origin === current.origin ||
    (SITE_HOSTS.has(url.hostname) && SITE_HOSTS.has(current.hostname));
}

export function trackedDestination(href: string, currentHref: string): TrackedDestination | null {
  try {
    const current = new URL(currentHref);
    const target = new URL(href, current);
    if (internalDestination(target, current) && canonicalPath(target.pathname) === TOOL_PATH) {
      return 'ride_calculator';
    }
    if (target.protocol === 'https:' &&
        target.hostname === 'play.google.com' &&
        target.pathname === '/store/apps/details' &&
        target.searchParams.get('id') === 'br.com.calcmot') {
      return 'play_store';
    }
  } catch { /* URL inválida não é um clique atribuído */ }
  return null;
}

export interface CalculatorEntry {
  readonly sourcePage: PageGroup;
  readonly placement: string;
  readonly entryType: TrafficEntry;
}

/** Não transmitimos o referrer bruto, apenas seu grupo de página. */
export function entryFromReferrer(referrer: string, currentHref: string): CalculatorEntry {
  try {
    if (referrer) {
      const previous = new URL(referrer);
      const current = new URL(currentHref);
      if (internalDestination(previous, current)) {
        return { sourcePage: pageGroup(previous.pathname), placement: 'other_link', entryType: 'internal' };
      }
      return { sourcePage: 'external', placement: 'other_link', entryType: 'external' };
    }
  } catch { /* Sem referrer confiável */ }
  return { sourcePage: 'direct', placement: 'other_link', entryType: 'direct' };
}

/** Ponte de navegação: sessionStorage mantém só categorias por até 2 minutos. */
export function storedCalculatorEntry(raw: string | null, now: number): CalculatorEntry | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (typeof value['timestamp'] !== 'number' ||
        value['timestamp'] > now ||
        now - value['timestamp'] > 120_000 ||
        typeof value['sourcePage'] !== 'string' ||
        !PAGES.has(value['sourcePage'] as PageGroup) ||
        value['sourcePage'] === 'external' ||
        value['sourcePage'] === 'direct' ||
        typeof value['placement'] !== 'string') return null;
    return {
      sourcePage: value['sourcePage'] as PageGroup,
      placement: safePlacement(value['placement']),
      entryType: 'internal',
    };
  } catch { return null; }
}
