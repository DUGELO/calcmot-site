import { BRAND_TOKENS } from '../constants/brand.tokens';

export type JsonLd = Record<string, unknown>;

const absoluteUrl = (path: string): string | null => {
  const base = BRAND_TOKENS.site.url.replace(/\/+$/, '');

  if (!base) {
    return null;
  }

  return path === '/' ? `${base}/` : `${base}${path.replace(/\/+$/, '')}/`;
};

const withUrl = (data: JsonLd, path: string): JsonLd => {
  const url = absoluteUrl(path);

  return url ? { ...data, url } : data;
};

/**
 * Only verifiable data: no ratings, no download counts, no invented prices.
 */
export function webSiteJsonLd(): JsonLd {
  return withUrl(
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: BRAND_TOKENS.site.name,
      inLanguage: 'pt-BR',
    },
    '/',
  );
}

export function softwareApplicationJsonLd(description: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: BRAND_TOKENS.site.name,
    applicationCategory: 'TravelApplication',
    operatingSystem: 'Android',
    inLanguage: 'pt-BR',
    description,
    installUrl: BRAND_TOKENS.links.playStore,
  };
}

export function webPageJsonLd(path: string, name: string, description: string): JsonLd {
  return withUrl(
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name,
      description,
      inLanguage: 'pt-BR',
      isPartOf: {
        '@type': 'WebSite',
        name: BRAND_TOKENS.site.name,
      },
    },
    path,
  );
}

export function faqJsonLd(items: readonly { question: string; answer: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/** Only destinations that actually exist and are linked on the page. */
export function breadcrumbJsonLd(items: readonly { name: string; path: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem', position: index + 1, name: item.name, item: absoluteUrl(item.path),
    })),
  };
}

/** Calculadora web gratuita: dados estruturados sem alegações de avaliações ou ganhos. */
export function rideCalculatorWebAppJsonLd(path: string, description: string): JsonLd {
  return withUrl(
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Calculadora de corrida Uber e 99 — CalcMot',
      description,
      applicationCategory: 'FinanceApplication',
      browserRequirements: 'Navegador com JavaScript habilitado',
      inLanguage: 'pt-BR',
      isAccessibleForFree: true,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'BRL',
      },
    },
    path,
  );
}
