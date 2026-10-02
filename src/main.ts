import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { captureBootstrapError, initializeSentry } from './app/core/observability/sentry.config';

initializeSentry();

bootstrapApplication(AppComponent, appConfig).catch((error) => {
  captureBootstrapError(error);
  console.error(error);
});
