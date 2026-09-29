import { RenderMode, type ServerRoute } from '@angular/ssr';

/**
 * Public pages are prerendered as static HTML for deployments without a Node
 * runtime. The wildcard keeps the local Angular SSR fallback for other paths.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'como-funciona', renderMode: RenderMode.Prerender },
  { path: 'calculadora-ganhos-motorista-app', renderMode: RenderMode.Prerender },
  { path: 'privacidade', renderMode: RenderMode.Prerender },
  { path: 'suporte', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Server },
];
