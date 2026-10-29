/** Missing editorial routes fail closed before Angular's legacy wildcard redirect. */
export function withBlogRouting(handler, manifest) {
  const paths = new Set([...manifest.paths, ...manifest.slugs.map(slug => 'blog/' + slug)]);
  return {
    async fetch(request, env, context) {
      const url = new URL(request.url);
      if (!/^\/blog(?:\/|$)/.test(url.pathname)) return handler.fetch(request, env, context);
      if (!['GET','HEAD'].includes(request.method)) return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
      const path = url.pathname.replace(/^\/|\/+$/g, '');
      const slug = path.slice(5);
      if (Object.hasOwn(manifest.redirects, slug)) {
        url.pathname = '/blog/' + manifest.redirects[slug] + '/';
        return Response.redirect(url.href, 301);
      }
      if (!paths.has(path)) return new Response(request.method === 'HEAD' ? null : '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Artigo não encontrado — CalcMot</title></head><body><main><h1>Artigo não encontrado</h1><p>Este conteúdo não está disponível.</p><a href="/blog/">Voltar ao blog</a></main></body></html>', {
        status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, follow', 'Cache-Control': 'no-store' },
      });
      // Existing documents normally bypass the Worker via Assets.
      return handler.fetch(request, env, context);
    },
  };
}
