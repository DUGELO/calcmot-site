import { DOCUMENT } from '@angular/core';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { BRAND_TOKENS } from '../constants/brand.tokens';

export interface PageMetaConfig {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly canonical?: string;
  readonly robots?: string;
  readonly type?: 'website' | 'article';
  readonly image?: string;
  readonly imageAlt?: string;
  readonly publishedAt?: string;
  readonly updatedAt?: string;
  readonly structuredData?: readonly Record<string, unknown>[];
}

const JSON_LD_ELEMENT_ID = 'calcmot-structured-data';

@Injectable({ providedIn: 'root' })
export class PageMetaService {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  apply(config: PageMetaConfig): void {
    const baseUrl = BRAND_TOKENS.site.url.replace(/\/+$/, '');
    const canonicalUrl = config.canonical ?? (baseUrl
      ? config.path === '/'
        ? `${baseUrl}/`
        : `${baseUrl}${config.path.replace(/\/+$/, '')}/`
      : null);

    this.titleService.setTitle(config.title);
    this.meta.updateTag({ name: 'description', content: config.description });
    this.meta.updateTag({ name: 'robots', content: config.robots ?? 'index,follow' });
    this.meta.updateTag({ property: 'og:type', content: config.type ?? 'website' });
    this.meta.updateTag({ property: 'og:locale', content: BRAND_TOKENS.site.locale });
    this.meta.updateTag({ property: 'og:site_name', content: BRAND_TOKENS.site.name });
    this.meta.updateTag({ property: 'og:title', content: config.title });
    this.meta.updateTag({ property: 'og:description', content: config.description });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: config.title });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });

    if (canonicalUrl) {
      this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
      this.setCanonical(canonicalUrl);
    }

    for (const [property, content] of [
      ['article:published_time', config.publishedAt],
      ['article:modified_time', config.updatedAt],
      ['og:image:alt', config.imageAlt],
    ]) {
      if (content) this.meta.updateTag({ property: property!, content });
      else this.meta.removeTag('property="' + property + '"');
    }
    const ogImage = config.image ?? BRAND_TOKENS.assets.ogImage;

    if (ogImage) {
      this.meta.updateTag({ property: 'og:image', content: ogImage });
      this.meta.updateTag({ name: 'twitter:image', content: ogImage });
      this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    }

    if (!ogImage) {
      this.meta.removeTag('property="og:image"');
      this.meta.removeTag('name="twitter:image"');
    }

    this.setStructuredData(config.structuredData ?? []);
  }

  private setCanonical(url: string): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }

    link.setAttribute('href', url);
  }

  private setStructuredData(blocks: readonly Record<string, unknown>[]): void {
    this.document.querySelector(`#${JSON_LD_ELEMENT_ID}`)?.remove();

    if (blocks.length === 0) {
      return;
    }

    const script = this.document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('id', JSON_LD_ELEMENT_ID);
    script.textContent = JSON.stringify(blocks.length === 1 ? blocks[0] : blocks)
      .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
    this.document.head.appendChild(script);
  }
}
