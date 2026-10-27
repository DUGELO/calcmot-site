import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { adminBuildEnvironment } from "../scripts/admin-build-environment.mjs";

assert.deepEqual(adminBuildEnvironment("DEV"), {
  target: "DEV",
  configuration: "production,admin-staging",
});
assert.deepEqual(adminBuildEnvironment("PROD"), {
  target: "PROD",
  configuration: "production,admin-production",
});
for (const value of [
  "",
  "prod",
  "PRODUCTION",
  "DEV ",
  null,
  "https://example.invalid",
])
  assert.throws(() => adminBuildEnvironment(value));

const angular = JSON.parse(await readFile("angular.json", "utf8"));
const build = angular.projects["calcmot-site"].architect.build;
assert.equal(build.defaultConfiguration, "production");
assert.equal(build.configurations.production.fileReplacements, undefined);
for (const [name, file] of [
  ["staging", "staging"],
  ["production", "production"],
])
  assert.deepEqual(build.configurations[`admin-${name}`].fileReplacements, [
    {
      replace: "src/environments/environment.ts",
      with: `src/environments/environment.${file}.ts`,
    },
  ]);
const defaultEnv = await readFile("src/environments/environment.ts", "utf8");
const prodEnv = await readFile(
  "src/environments/environment.production.ts",
  "utf8",
);
assert.match(defaultEnv, /environment: "DEV"/);
assert.match(prodEnv, /environment: "PROD"/);
assert.match(prodEnv, /mutationsEnabled: true/);
console.log(
  "Admin build selection passed: explicit file replacements, unchanged default DEV and invalid target rejection.",
);
