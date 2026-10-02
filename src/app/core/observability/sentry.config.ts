import { ErrorHandler, isDevMode } from '@angular/core';
import * as Sentry from '@sentry/angular';
import { ANALYTICS_CONFIG } from '../constants/analytics.config';

let initialized = false;

// Keep monitoring inactive during prerender/SSR, local development and previews.
function isProductionBrowser(): boolean {
  return typeof window !== 'undefined' && !isDevMode() &&
    ANALYTICS_CONFIG.productionHosts.some((host) => host === window.location.hostname);
}

function sanitizeUrl(value: string): string {
  return value.split(/[?#]/, 1)[0].replace(/^(https?:\/\/)[^/@]+@/i, '$1');
}

export function initializeSentry(): void {
  if (initialized || !isProductionBrowser()) return;

  Sentry.init({
    dsn: 'https://0e81788289cc6fc55f941afa1e51c2f4@o4512188297248768.ingest.de.sentry.io/4512188373598288',
    environment: 'production',
    // SDK 11 uses dataCollection to control PII; do not collect visitor data.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      stackFrameVariables: false,
    },
    // Error monitoring only; no automatic session reports, tracing or replay.
    integrations: (defaults) => defaults.filter((integration) => integration.name !== 'BrowserSession'),
    beforeSendLog: () => null,
    beforeSendMetric: () => null,
    beforeSend(event) {
      delete event.user;
      if (event.request) {
        if (event.request.url) event.request.url = sanitizeUrl(event.request.url);
        delete event.request.cookies;
        delete event.request.headers;
        delete event.request.data;
        delete event.request.query_string;
      }
      for (const breadcrumb of event.breadcrumbs ?? []) {
        if (!breadcrumb.data) continue;
        for (const key of ['url', 'from', 'to']) {
          const value = breadcrumb.data[key];
          if (typeof value === 'string') breadcrumb.data[key] = sanitizeUrl(value);
        }
        delete breadcrumb.data['url.query'];
        delete breadcrumb.data['url.fragment'];
      }
      for (const exception of event.exception?.values ?? []) {
        for (const frame of exception.stacktrace?.frames ?? []) {
          if (frame.filename) frame.filename = sanitizeUrl(frame.filename);
        }
      }
      return event;
    },
  });
  initialized = true;
}

export function createSiteErrorHandler(): ErrorHandler {
  return initialized && isProductionBrowser() ? Sentry.createErrorHandler() : new ErrorHandler();
}

export function captureBootstrapError(error: unknown): void {
  if (initialized && isProductionBrowser()) Sentry.captureException(error);
}
