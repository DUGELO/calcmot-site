import { DOCUMENT } from '@angular/common';
import { Injectable, inject, isDevMode } from '@angular/core';
import { ANALYTICS_CONFIG } from '../constants/analytics.config';

type Clarity = ((...args: unknown[]) => void) & { q?: unknown[][] };
interface AnalyticsWindow extends Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  clarity?: Clarity;
}

@Injectable({ providedIn: 'root' })
export class SiteAnalyticsService {
  private readonly document = inject(DOCUMENT);
  private initialized = false;

  // Called after hydration: no scripts or collection during SSG/SSR,
  // development, localhost or Cloudflare preview deployments.
  initialize(): void {
    const browser = this.document.defaultView as AnalyticsWindow | null;
    if (
      !browser || this.initialized || isDevMode() ||
      !ANALYTICS_CONFIG.productionHosts.some((host) => host === browser.location.hostname)
    ) return;
    this.initialized = true;

    browser.dataLayer = browser.dataLayer || [];
    browser.gtag = browser.gtag || function (..._args: unknown[]) {
      browser.dataLayer!.push(arguments);
    };
    // Consent defaults are granted automatically, as configured by the site
    // owner. Set defaults before any commands that collect measurement data.
    browser.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    });
    browser.gtag('js', new Date());
    // GA4 enhanced measurement owns page_view, including History API changes.
    // Do not also emit manual router page_view events.
    browser.gtag('config', ANALYTICS_CONFIG.googleMeasurementId);
    this.loadScript('calcmot-ga4', `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.googleMeasurementId}`);

    browser.clarity = browser.clarity || Object.assign(
      (...args: unknown[]) => { (browser.clarity!.q ||= []).push(args); },
      { q: [] as unknown[][] },
    );
    browser.clarity('consentv2', {
      analytics_Storage: 'granted',
      ad_Storage: 'granted',
    });
    this.loadScript('calcmot-clarity', `https://www.clarity.ms/tag/${ANALYTICS_CONFIG.clarityProjectId}`);
  }

  private loadScript(id: string, src: string): void {
    if (this.document.getElementById(id)) return;
    const script = this.document.createElement('script');
    script.id = id;
    script.async = true;
    script.src = src;
    this.document.head.appendChild(script);
  }
}
