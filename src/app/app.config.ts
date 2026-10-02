import { ErrorHandler, type ApplicationConfig } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { createSiteErrorHandler } from './core/observability/sentry.config';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    { provide: ErrorHandler, useFactory: createSiteErrorHandler },
  ],
};
