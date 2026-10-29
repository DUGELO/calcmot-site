import {
  cp,
  mkdir,
  readFile,
  writeFile,
  symlink,
  access,
  rm,
} from "node:fs/promises";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { adminBuildEnvironment } from "./admin-build-environment.mjs";

const adminBuild = adminBuildEnvironment();
// Also prepare editorial output when invoked directly by Wrangler's custom build.
for (const script of ['scripts/generate-blog.mjs', 'scripts/generate-sitemap.mjs']) {
  execFileSync(process.execPath, [resolve(script)], { stdio: 'inherit' });
}

// Isolate Wrangler's neutral Angular adaptation from the source/default SSR build.
const workspace = resolve(".angular/cloudflare-workspace");
await mkdir(workspace, { recursive: true });
for (const directory of ["src", "public"]) {
  // Do not retain removed articles/media from a previous editorial build.
  await rm(resolve(workspace, directory), { recursive: true, force: true });
  await cp(resolve(directory), resolve(workspace, directory), {
    recursive: true,
  });
}
for (const file of ["package.json", "tsconfig.json", "tsconfig.app.json"]) {
  await cp(resolve(file), resolve(workspace, file));
}
await cp(
  resolve("cloudflare/angular.server.ts"),
  resolve(workspace, "src/server.ts"),
);
const modules = resolve(workspace, "node_modules");
if (
  !(await access(modules).then(
    () => true,
    () => false,
  ))
) {
  await symlink(
    resolve("node_modules"),
    modules,
    process.platform === "win32" ? "junction" : "dir",
  );
}
const config = JSON.parse(await readFile("angular.json", "utf8"));
const options = config.projects["calcmot-site"].architect.build.options;
options.outputPath = resolve("dist/calcmot-cloudflare");
options.ssr = { entry: "src/server.ts", experimentalPlatform: "neutral" };
await writeFile(
  resolve(workspace, "angular.json"),
  JSON.stringify(config, null, 2),
);
execFileSync(
  process.execPath,
  [
    resolve("node_modules/@angular/cli/bin/ng.js"),
    "build",
    "--configuration",
    adminBuild.configuration,
  ],
  {
    cwd: workspace,
    stdio: "inherit",
  },
);
await writeFile(
  resolve("dist/calcmot-cloudflare/admin-environment.mjs"),
  `export const adminEnvironment = ${JSON.stringify(adminBuild.target)};\n`,
);
