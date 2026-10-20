import { DOCUMENT } from '@angular/common';
import { Injectable, inject, isDevMode } from '@angular/core';
import { ANALYTICS_CONFIG } from '../constants/analytics.config';
import { entryFromReferrer, pageGroup, safePlacement, storedCalculatorEntry, trackedDestination } from '../analytics/conversion-attribution';

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
  private calculatorViewTracked = false;
  private readonly entryKey = 'calcmot_calculator_entry_v1';

  // Called after hydration: no scripts or collection during SSG/SSR,
  // development, localhost or Cloudflare preview deployments.
  initialize(): void {
    const browser = this.document.defaultView as AnalyticsWindow | null;
    if (
      !browser || /^\/admin(?:\/|$)/.test(browser.location.pathname) || this.initialized || isDevMode() ||
      !ANALYTICS_CONFIG.productionHosts.some((host) => host === browser.location.hostname)
    ) return;
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
    // Só registrar eventos após preparar a fila gtag e configurar a propriedade.
    // A fila recebe web_calculator_viewed mesmo antes de o script externo carregar.
    this.initialized = true;
    this.document.addEventListener('click', this.trackNavigationClick, { capture: true });
    if (pageGroup(browser.location.pathname) === 'ride_calculator') this.trackCalculatorView(browser);

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

  /** Eventos agregados: nunca transmitir valores financeiros nem campos do formulário. */
  trackToolEvent(event: 'web_tool_started' | 'web_tool_completed' | 'web_tool_first_completed' | 'web_result_shared' | 'web_instagram_clicked'): void {
    const browser = this.document.defaultView as AnalyticsWindow | null;
    if (!browser || !this.initialized || !browser.gtag) return;
    browser.gtag('event', event, { tool_id: 'ride_calculator' });
  }

  /** Eventos de conversão categóricos, sem URL/referrer bruto, valores ou identificadores. */
  private readonly trackNavigationClick = (event: MouseEvent): void => {
    const browser = this.document.defaultView as AnalyticsWindow | null;
    if (!this.initialized || !browser || !event.isTrusted) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest('a[href]');
    if (!(anchor instanceof HTMLAnchorElement)) return;
    const destination = trackedDestination(anchor.href, browser.location.href);
    if (!destination) return;
    const placement = safePlacement(anchor.getAttribute('data-analytics-placement'));
    const sourcePage = pageGroup(browser.location.pathname);
    if (destination === 'ride_calculator') {
      try {
        browser.sessionStorage.setItem(this.entryKey, JSON.stringify({
          sourcePage, placement, timestamp: Date.now(),
        }));
      } catch { /* navegação funciona mesmo sem storage */ }
      browser.gtag?.('event', 'web_calculator_link_clicked', {
        source_page: sourcePage, link_placement: placement, destination: 'ride_calculator',
      });
    } else {
      browser.gtag?.('event', 'web_play_store_clicked', {
        source_page: sourcePage, link_placement: placement, destination: 'play_store',
      });
    }
  };

  private trackCalculatorView(browser: AnalyticsWindow): void {
    if (this.calculatorViewTracked) return;
    this.calculatorViewTracked = true;
    let entry = null;
    try {
      entry = storedCalculatorEntry(browser.sessionStorage.getItem(this.entryKey), Date.now());
      browser.sessionStorage.removeItem(this.entryKey);
    } catch { /* Navegação privada pode desabilitar storage */ }
    const classified = entry ?? entryFromReferrer(this.document.referrer, browser.location.href);
    browser.gtag?.('event', 'web_calculator_viewed', {
      source_page: classified.sourcePage,
      link_placement: classified.placement,
      entry_type: classified.entryType,
      destination: 'ride_calculator',
    });
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
