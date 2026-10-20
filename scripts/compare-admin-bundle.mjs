import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";
const [baselineArg, currentArg] = process.argv.slice(2);
if (!baselineArg || !currentArg)
  throw new Error(
    "Uso: node scripts/compare-admin-bundle.mjs <baseline/browser> <current/browser>",
  );
function inspect(directory) {
  const base = resolve(directory),
    html = readFileSync(resolve(base, "index.html"), "utf8");
  const files = new Set();
  const add = (file) => {
    file = file.replace(/^\.\//, "");
    if (files.has(file) || !file.endsWith(".js")) return;
    files.add(file);
    const js = readFileSync(resolve(base, file), "utf8");
    for (const match of js.matchAll(
      /\b(?:import|export)\s*(?:\{[^}]*\}|\*\s+as\s+\w+)\s*from\s*["']([^"']+)["']/g,
    ))
      if (match[1].startsWith("./")) add(match[1]);
    for (const match of js.matchAll(/\bimport\s*["']([^"']+)["']/g))
      if (match[1].startsWith("./")) add(match[1]);
  };
  for (const match of html.matchAll(/<script[^>]+src="([^"]+\.js)"/g))
    add(match[1]);
  for (const match of html.matchAll(/<link[^>]+href="([^"]+\.js)"/g))
    add(match[1]);
  for (const match of html.matchAll(/<link[^>]+href="([^"]+\.css)"/g))
    files.add(match[1]);
  let raw = 0,
    gzip = 0;
  for (const file of files) {
    const data = readFileSync(resolve(base, file));
    raw += data.length;
    gzip += gzipSync(data).length;
  }
  const scripts = readdirSync(base).filter((file) => file.endsWith(".js"));
  const initial = [...files]
    .filter((file) => file.endsWith(".js"))
    .map((file) => readFileSync(resolve(base, file), "utf8"))
    .join("\n");
  return {
    rawBytes: raw,
    gzipBytes: gzip,
    initialFiles: [...files],
    initialContainsAdminUi: initial.includes("Cuidado em cada decisão."),
    artifactContainsSyntheticFixtures: scripts.some((file) =>
      /DEMO-2026|synthetic:case-support|Protótipo local de teste/.test(
        readFileSync(resolve(base, file), "utf8"),
      ),
    ),
  };
}
const baseline = inspect(baselineArg),
  current = inspect(currentArg);
const report = {
  baseline,
  current,
  delta: {
    rawBytes: current.rawBytes - baseline.rawBytes,
    gzipBytes: current.gzipBytes - baseline.gzipBytes,
    rawPercent: Number(
      ((current.rawBytes / baseline.rawBytes - 1) * 100).toFixed(2),
    ),
  },
  note: "Initial JS/CSS only, including recursive static imports. Lazy monitoring and Firebase are reported separately by Angular build. Gzip is calculated consistently per emitted file.",
};
writeFileSync(
  "docs/admin/bundle-comparison.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
if (current.initialContainsAdminUi || current.artifactContainsSyntheticFixtures)
  throw new Error(
    "Admin UI or synthetic fixtures leaked into unexpected production bundle",
  );
