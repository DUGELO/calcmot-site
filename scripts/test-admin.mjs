import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { build, stop } from "esbuild";
import { mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
execFileSync(
  process.execPath,
  [resolve("node_modules/typescript/bin/tsc"), "-p", "tests/tsconfig.json"],
  { stdio: "inherit" },
);
await mkdir(".angular/admin-tests", { recursive: true });
await build({
  entryPoints: ["tests/admin.spec.ts"],
  outfile: ".angular/admin-tests/run.mjs",
  bundle: true,
  packages: "external",
  platform: "node",
  format: "esm",
  target: "node22",
  tsconfig: "tsconfig.json",
  alias: { "@sentry/angular": "./tests/sentry.fixture.ts" },
});
await import(
  pathToFileURL(`${process.cwd()}/.angular/admin-tests/run.mjs`).href
);

stop();
