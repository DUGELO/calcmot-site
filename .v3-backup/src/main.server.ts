import {
  mergeApplicationConfig,
  type ApplicationConfig,
} from '@angular/core';

import {
  bootstrapApplication,
  type BootstrapContext,
} from '@angular/platform-browser';

import {
  provideServerRendering,
  withRoutes,
} from '@angular/ssr';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { serverRoutes } from './app/app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(
      withRoutes(serverRoutes),
    ),
  ],
};

const config = mergeApplicationConfig(appConfig, serverConfig);

const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(AppComponent, config, context);

export default bootstrap;