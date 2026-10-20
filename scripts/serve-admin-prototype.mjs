import { readFile, writeFile, mkdir, cp } from "node:fs/promises";
import { resolve, relative, extname } from "node:path";
import { createServer } from "node:http";
import { execFileSync } from "node:child_process";

// AOT test harness. It compiles the real feature with test-only providers in .angular.
// It never changes angular.json, ships fixtures, or contacts a real backend.
const workspace = resolve(".angular/admin-prototype-workspace");
const port = Number(process.env["ADMIN_TEST_PORT"] ?? 4311);
const out = resolve(".angular/admin-prototype");
await mkdir(workspace, { recursive: true });
await cp(resolve("src/assets/brand"), resolve(workspace, "brand"), {
  recursive: true,
});
await writeFile(
  resolve(workspace, "index.html"),
  '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><base href="/"><title>CalcMot · Protótipo sintético local</title></head><body><app-prototype></app-prototype></body></html>',
);
await writeFile(
  resolve(workspace, "tsconfig.json"),
  JSON.stringify(
    {
      extends: "../../tsconfig.json",
      compilerOptions: { outDir: "../admin-prototype-ts", types: [] },
      files: ["../../tests/admin-prototype.ts"],
      angularCompilerOptions: { strictTemplates: true },
    },
    null,
    2,
  ),
);
await writeFile(
  resolve(workspace, "angular.json"),
  JSON.stringify(
    {
      version: 1,
      projects: {
        prototype: {
          projectType: "application",
          root: "",
          architect: {
            build: {
              builder: "@angular/build:application",
              options: {
                browser: "../../tests/admin-prototype.ts",
                index: "index.html",
                tsConfig: "tsconfig.json",
                polyfills: ["zone.js"],
                styles: ["../../src/styles.scss"],
                assets: [
                  { glob: "**/*", input: "brand", output: "assets/brand" },
                ],
                inlineStyleLanguage: "scss",
                outputPath: { base: "../admin-prototype", browser: "" },
                optimization: false,
                sourceMap: false,
              },
            },
          },
        },
      },
    },
    null,
    2,
  ),
);
execFileSync(
  process.execPath,
  [resolve("node_modules/@angular/cli/bin/ng.js"), "build"],
  { cwd: workspace, stdio: "inherit" },
);
const mime = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
};
createServer(async (req, res) => {
  try {
    const path = new URL(req.url, "http://127.0.0.1").pathname;
    if (path.startsWith("/api/")) {
      res.writeHead(403);
      res.end();
      return;
    }
    const file = resolve(out, "." + path);
    if (relative(out, file).startsWith("..")) throw new Error("invalid path");
    const extension = extname(path);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    if (Object.hasOwn(mime, extension)) {
      res.setHeader("Content-Type", mime[extension]);
      res.end(await readFile(file));
    } else {
      res.setHeader("Content-Type", "text/html;charset=utf-8");
      res.end(await readFile(resolve(out, "index.html")));
    }
  } catch {
    res.writeHead(404);
    res.end();
  }
}).listen(port, "127.0.0.1", () =>
  console.log(
    "Synthetic AOT test harness: http://127.0.0.1:" +
      port +
      "/admin (no real API, never deploy this harness)",
  ),
);
