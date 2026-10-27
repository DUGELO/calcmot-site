const basePrivateHeaders = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "Content-Security-Policy": [
    "default-src 'none'",
    "script-src 'self' https://apis.google.com https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://www.gstatic.com",
    "font-src 'self'",
    "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com",
    "frame-src https://calcmot.firebaseapp.com https://accounts.google.com https://apis.google.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self' https://accounts.google.com",
  ].join("; "),
};
const privatePath = (path) =>
  /^\/admin(?:\/|$)/.test(path) || /^\/index\.csr(?:[/.]|$)/.test(path);

/** Document routing only. This Worker never authenticates, proxies or fetches private data. */
export function withAdminRouting(publicHandler, environment = "DEV") {
  if (environment !== "DEV" && environment !== "PROD")
    throw new Error("Unknown administrative build environment.");
  const privateHeaders = {
    ...basePrivateHeaders,
    "X-CalcMot-Environment": environment,
  };
  return {
    async fetch(request, env, context) {
      const url = new URL(request.url);
      // The gateway owns these routes. If they ever reach the site, fail closed.
      if (/^\/api(?:\/|$)/.test(url.pathname)) {
        return Response.json(
          { code: "NOT_FOUND" },
          { status: 404, headers: privateHeaders },
        );
      }
      if (!privatePath(url.pathname))
        return publicHandler.fetch(request, env, context);
      if (url.origin !== "https://calcmot.com.br") {
        return new Response("Not found.", {
          status: 404,
          headers: privateHeaders,
        });
      }
      if (!["GET", "HEAD"].includes(request.method)) {
        return new Response(null, {
          status: 405,
          headers: { ...privateHeaders, Allow: "GET, HEAD" },
        });
      }
      // Extensionless asset lookup avoids HTML-handling redirect to /index.csr.
      // No browser headers, cookies or bearer credentials are forwarded to Assets.
      const shell = await env.ASSETS.fetch(
        new Request(new URL("/index.csr", url), { method: "GET" }),
      );
      if (
        shell.status !== 200 ||
        !shell.headers.get("Content-Type")?.includes("text/html")
      ) {
        return new Response("Painel temporariamente indisponível.", {
          status: 503,
          headers: privateHeaders,
        });
      }
      const html = (await shell.text())
        // Angular's deferred stylesheet uses an inline onload handler. Load it
        // normally in this shell so CSP can keep inline scripts disabled.
        .replace(/\s+media="print"\s+onload="this\.media='all'"/g, "")
        .replace(
          /<title>[\s\S]*?<\/title>/i,
          "<title>Administração | CalcMot</title>",
        )
        .replace(
          /<meta\s+name="robots"[^>]*>/i,
          '<meta name="robots" content="noindex, nofollow">',
        );
      return new Response(request.method === "HEAD" ? null : html, {
        headers: {
          ...privateHeaders,
          // Fixed loopback receiver only on the explicit PROD entry document.
          ...(environment === "PROD" && /^\/admin\/?$/.test(url.pathname)
            ? { "Content-Security-Policy": privateHeaders["Content-Security-Policy"].replace(
                "connect-src 'self'", "connect-src 'self' http://127.0.0.1:8971") }
            : {}),
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    },
  };
}
