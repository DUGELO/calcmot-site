import { RenderMode, PrerenderFallback, type ServerRoute } from '@angular/ssr';

/**
 * Public pages are prerendered as static HTML for deployments without a Node
 * runtime. The wildcard keeps the local Angular SSR fallback for other paths.
 */
import { BLOG_SLUGS, BLOG_LIST_PATHS, BLOG_REDIRECTS } from './blog/generated/routes';

const listParams = (pattern: string) => BLOG_LIST_PATHS.flatMap(path => {
  const keys: string[] = [];
  const expression = pattern.replace(/:[a-z]+/g, key => { keys.push(key.slice(1)); return '([^/]+)'; });
  const match = path.match(new RegExp('^' + expression + '$'));
  return match ? [Object.fromEntries(keys.map((key, i) => [key, match[i + 1]]))] : [];
});

export const serverRoutes: ServerRoute[] = [
  { path: 'blog', renderMode: RenderMode.Prerender },
  ...['blog/pagina/:page', 'blog/categoria/:category', 'blog/categoria/:category/pagina/:page'].map(path => ({
    path, renderMode: RenderMode.Prerender as const, fallback: PrerenderFallback.Server,
    getPrerenderParams: async () => listParams(path),
  })),
  ...Object.keys(BLOG_REDIRECTS).map(slug => ({
    path: 'blog/' + slug, renderMode: RenderMode.Server as const, status: 301,
  })),
  { path: 'blog/:slug', renderMode: RenderMode.Prerender, fallback: PrerenderFallback.Server,
    getPrerenderParams: async () => BLOG_SLUGS.map(slug => ({ slug })) },
  { path: 'blog/**', renderMode: RenderMode.Server },
  { path: 'admin', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'como-funciona', renderMode: RenderMode.Prerender },
  { path: 'calculadora-ganhos-motorista-app', renderMode: RenderMode.Prerender },
  { path: 'ferramentas/corrida-vale-a-pena', renderMode: RenderMode.Prerender },
  { path: 'privacidade', renderMode: RenderMode.Prerender },
  { path: 'suporte', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Server },
];
