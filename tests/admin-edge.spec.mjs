import assert from "node:assert/strict";
import { withAdminRouting } from "../cloudflare/admin-routing.mjs";

let publicCalls = 0,
  assetCalls = 0;
const handler = withAdminRouting({
  fetch: async () => {
    publicCalls++;
    return new Response("public SSR");
  },
});
const env = {
  ASSETS: {
    fetch: async (request) => {
      assetCalls++;
      assert.equal(new URL(request.url).pathname, "/index.csr");
      assert.equal(request.headers.has("Authorization"), false);
      assert.equal(request.headers.has("Cookie"), false);
      return new Response(
        '<title>Public</title><meta name="robots" content="index,follow"><app-root></app-root>',
        { headers: { "Content-Type": "text/html" } },
      );
    },
  },
};
assert.throws(() =>
  withAdminRouting({ fetch: async () => new Response("public") }, "UNKNOWN"),
);
const prodShell = withAdminRouting(
  { fetch: async () => new Response("public") },
  "PROD",
);
const prodResponse = await prodShell.fetch(
  new Request("https://calcmot.com.br/admin"),
  env,
);
assert.equal(prodResponse.headers.get("X-CalcMot-Environment"), "PROD");
for (const path of [
  "/admin",
  "/admin/",
  "/admin/solicitacoes/case",
  "/index.csr",
  "/index.csr.html",
]) {
  const response = await handler.fetch(
    new Request(`https://calcmot.com.br${path}`, {
      headers: { Authorization: "Bearer synthetic", Cookie: "synthetic=1" },
    }),
    env,
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.match(response.headers.get("X-Robots-Tag"), /noindex/);
  const html = await response.text();
  assert.match(html, /Administração/);
  assert.match(html, /content="noindex, nofollow"/);
  assert.doesNotMatch(html, /Bearer|synthetic|index,follow/);
}
for (const host of [
  "calcmot-site.eduardoangelo20001.workers.dev",
  "preview.example",
  "www.calcmot.com.br",
]) {
  const response = await handler.fetch(
    new Request(`https://${host}/admin`),
    env,
  );
  assert.equal(response.status, 404);
}
for (const path of [
  "/api",
  "/api/admin/v1",
  "/api/admin/v1/session",
  "/api/admin/v1/unknown",
]) {
  const response = await handler.fetch(
    new Request(`https://calcmot.com.br${path}`),
    env,
  );
  assert.equal(response.status, 404);
  assert.match(response.headers.get("Content-Type"), /application\/json/);
  assert.deepEqual(await response.json(), { code: "NOT_FOUND" });
}
assert.equal(publicCalls, 0);
for (const path of [
  "/",
  "/como-funciona",
  "/calculadora-ganhos-motorista-app/",
  "/ferramentas/corrida-vale-a-pena/",
  "/privacidade/",
  "/suporte/",
  "/admin-other",
  "/assets/brand/calcmot-icon.png",
]) {
  const response = await handler.fetch(
    new Request(`https://calcmot.com.br${path}`),
    env,
  );
  assert.equal(await response.text(), "public SSR");
  assert.equal(response.headers.has("X-CalcMot-Environment"), false);
}
assert.equal(publicCalls, 8);
assert.equal(assetCalls, 6); // Five DEV shells plus the explicit read-only PROD shell.
const head = await handler.fetch(
  new Request("https://calcmot.com.br/admin", { method: "HEAD" }),
  env,
);
assert.equal(await head.text(), "");
const post = await handler.fetch(
  new Request("https://calcmot.com.br/admin", { method: "POST" }),
  env,
);
assert.equal(post.status, 405);
for (const status of [404, 307]) {
  const failure = await handler.fetch(
    new Request("https://calcmot.com.br/admin"),
    { ASSETS: { fetch: async () => new Response(null, { status }) } },
  );
  assert.equal(failure.status, 503);
  assert.equal(failure.headers.has("Location"), false);
}
console.log(
  "Edge routing passed: CSR, headers, canonical origin, API fail-closed, no credential forwarding, public delegation, HEAD/405 and missing shell. No remote calls.",
);
