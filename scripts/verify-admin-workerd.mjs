import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

// Use Miniflare from the pinned Wrangler toolchain, without a browser API proxy.
const modulePath = process.argv[2];
const { Miniflare, convertV4MiniflareOptions } = await import(
  modulePath ? pathToFileURL(resolve(modulePath)).href : "miniflare"
);
const parsed = ts.parseConfigFileTextToJson(
  "wrangler.jsonc",
  await readFile("wrangler.jsonc", "utf8"),
);
assert.equal(parsed.error, undefined);
const config = parsed.config;
const expectedEnvironment = process.env.ADMIN_WORKER_TEST_ENVIRONMENT ?? "DEV";
assert.ok(["DEV", "PROD"].includes(expectedEnvironment));
const options = {
  workers: [
    {
      name: "calcmot-site",
      modules: true,
      scriptPath: resolve(".angular/worker-dryrun/worker.js"),
      compatibilityDate:
        process.env.ADMIN_WORKER_TEST_DATE ?? config.compatibility_date,
      assets: {
        routerConfig: { has_user_worker: true },
        directory: resolve(config.assets.directory),
        binding: "ASSETS",
        run_worker_first: config.assets.run_worker_first,
      },
    },
  ],
};
const runtime = new Miniflare(
  convertV4MiniflareOptions ? convertV4MiniflareOptions(options) : options,
);
try {
  for (const path of [
    "/admin",
    "/admin/",
    "/admin/solicitacoes/test-case",
    "/index.csr",
    "/index.csr.html",
  ]) {
    const response = await runtime.dispatchFetch(
      `https://calcmot.com.br${path}`,
    );
    assert.equal(response.headers.get("X-CalcMot-Environment"), expectedEnvironment);
    assert.equal(
      response.status,
      200,
      response.status === 200 ? path : `${path}: ${await response.text()}`,
    );
    assert.match(response.headers.get("Cache-Control"), /no-store/);
    assert.match(response.headers.get("X-Robots-Tag"), /noindex/);
    assert.match(
      response.headers.get("Content-Security-Policy"),
      /frame-ancestors 'none'/,
    );
    const html = await response.text();
    assert.match(html, /<app-root[^>]*><\/app-root>/);
    assert.match(html, /content="noindex, nofollow"/);
    assert.doesNotMatch(html, /onload="this\.media=/);
    assert.doesNotMatch(
      html,
      /Fila de solicitações|DEMO-2026|test-case|Bearer/,
    );
  }
  for (const host of [
    "calcmot-site.eduardoangelo20001.workers.dev",
    "branch.preview.invalid",
  ]) {
    assert.equal(
      (await runtime.dispatchFetch(`https://${host}/admin`)).status,
      404,
    );
    assert.equal(
      (await runtime.dispatchFetch(`https://${host}/api/admin/v1/session`))
        .status,
      404,
    );
  }
  for (const path of ["/api", "/api/admin/v1/session"]) {
    const response = await runtime.dispatchFetch(
      `https://calcmot.com.br${path}`,
    );
    assert.equal(response.status, 404);
    assert.match(response.headers.get("Content-Type"), /application\/json/);
  }
  const auditorConfig = await runtime.dispatchFetch("https://calcmot.com.br/auditor-interno/config");
  assert.equal(auditorConfig.status, 200);
  assert.deepEqual(await auditorConfig.json(), {enabled:false,siteKey:""});
  const auditorRequest = await runtime.dispatchFetch("https://calcmot.com.br/auditor-interno/analisar", {
    method:"POST",headers:{Origin:"https://calcmot.com.br"},body:"synthetic-no-credentials",
  });
  assert.equal(auditorRequest.status,503);
  assert.match(auditorRequest.headers.get("Cache-Control"),/no-store/);
  assert.equal((await auditorRequest.json()).code,"UNAVAILABLE");
  for (const path of [
    "/",
    "/como-funciona/",
    "/calculadora-ganhos-motorista-app/",
    "/ferramentas/corrida-vale-a-pena/",
    "/privacidade/",
    "/suporte/",
  ]) {
    const response = await runtime.dispatchFetch(
      `https://calcmot.com.br${path}`,
    );
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, /<h1/);
    assert.match(html, /name="robots" content="index,follow"/);
    assert.equal(response.headers.has("X-CalcMot-Environment"), false);
  }
  const redirect = await runtime.dispatchFetch(
    "https://calcmot.com.br/como-funciona",
    { redirect: "manual" },
  );
  assert.equal(redirect.status, 307);
  assert.equal(
    new URL(redirect.headers.get("Location"), "https://calcmot.com.br")
      .pathname,
    "/como-funciona/",
  );
  const icon = await runtime.dispatchFetch(
    "https://calcmot.com.br/assets/brand/calcmot-icon.png",
  );
  assert.equal(icon.status, 200);
  assert.match(icon.headers.get("Content-Type"), /image\/png/);
  console.log(
    `Local workerd + real Assets passed (compatibility date ${options.workers[0].compatibilityDate}): admin CSR/no-store/noindex, aliases denied, API JSON fail-closed, six public pages, redirect and official icon. No remote backend calls.`,
  );
} finally {
  await runtime.dispose();
}
