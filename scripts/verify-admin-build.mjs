import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const current = resolve(process.argv[2] ?? "dist/calcmot-site/browser");
const baseline = resolve(
  process.argv[3] ??
    ".angular/admin-release-baseline-2f89a6d/dist/calcmot-site/browser",
);
const routes = [
  "",
  "como-funciona",
  "calculadora-ganhos-motorista-app",
  "ferramentas/corrida-vale-a-pena",
  "privacidade",
  "suporte",
];
const normalize = (text) =>
  text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
for (const route of routes) {
  const html = await readFile(resolve(current, route, "index.html"), "utf8");
  const previous = await readFile(
    resolve(baseline, route, "index.html"),
    "utf8",
  ).catch(() => null);
  const h1 = normalize(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
  assert.ok(h1, `Missing public H1: /${route}`);
  assert.match(html, /name="robots" content="index,follow"/);
  assert.doesNotMatch(html, /DEMO-2026|synthetic:case|Cuidado em cada decisão/);
  if (previous) {
    assert.equal(
      h1,
      normalize(previous.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? ""),
    );
    const canonical = (text) =>
      text.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1];
    assert.equal(canonical(html), canonical(previous));
  }
}
assert.equal(
  await access(resolve(current, "admin/index.html")).then(
    () => true,
    () => false,
  ),
  false,
  "Private pages must not be prerendered",
);
const { reqHandler } = await import(
  pathToFileURL(resolve("dist/calcmot-site/server/server.mjs")).href
);
const server = createServer(reqHandler);
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
try {
  const { port } = server.address();
  for (const route of ["/admin", "/admin/solicitacoes/synthetic-case"]) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.doesNotMatch(
      html,
      /Cuidado em cada decisão|Fila de solicitações|synthetic-case|Authorization|DEMO-2026/,
    );
  }
  const home = await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /Pare de aceitar corrida no escuro/);
} finally {
  await new Promise((resolve) => server.close(resolve));
}
console.log(
  "Built-site checks passed: six public prerender routes retain H1/SEO; admin direct URLs return CSR shells with no administrative HTML/data. Edge authorization/cache headers require deployment verification.",
);
