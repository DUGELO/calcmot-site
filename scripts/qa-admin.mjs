import { readFileSync, readdirSync } from "node:fs";
import ts from "typescript";
const root = "src/app/admin";
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? walk(`${dir}/${entry.name}`)
      : [`${dir}/${entry.name}`],
  );
const files = walk(root);
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const worker = ts.parseConfigFileTextToJson(
  "wrangler.jsonc",
  readFileSync("wrangler.jsonc", "utf8"),
);
check(
  !worker.error && Object.hasOwn(worker.config ?? {}, "previews"),
  "Cloudflare's existing preview command requires a versioned previews block",
);
const presenters = [
  "requests-list",
  "request-status",
  "evidence-panel",
  "review-form",
  "operation-confirmation",
  "admin-confirmation",
  "admin-shell",
  "dashboard-summary",
  "case-audit",
];
for (const file of files.filter((f) => f.endsWith(".ts"))) {
  const text = readFileSync(file, "utf8");
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const name = file.split("/").at(-1);
  const visit = (node) => {
    check(node.kind !== ts.SyntaxKind.AnyKeyword, `${file}: any type`);
    if (
      ts.isImportDeclaration(node) &&
      presenters.some((p) => name.startsWith(p)) &&
      !node.importClause?.isTypeOnly
    ) {
      const dependency = node.moduleSpecifier.text;
      check(
        !/firebase|\/http|admin-api|admin-auth|workspace.store|session.service/.test(
          dependency,
        ),
        `${file}: presentation imports integration ${dependency}`,
      );
    }
    node.forEachChild(visit);
  };
  visit(ast);
  check(
    !/localStorage|sessionStorage|console\.(log|error)|innerHTML/.test(text),
    `${file}: unsafe persistence/logging/HTML`,
  );
  check(
    !/admin\.demo|tests\/|prototype|fixtures\//.test(text),
    `${file}: production source references fixtures`,
  );
}
const routes = readFileSync("src/app/app.routes.server.ts", "utf8");
check(
  routes.includes("path: 'admin', renderMode: RenderMode.Client") &&
    routes.includes("path: 'admin/**', renderMode: RenderMode.Client"),
  "Admin must use CSR",
);
check(
  !readFileSync("public/sitemap.xml", "utf8").includes("/admin"),
  "Admin found in public sitemap",
);
check(
  readFileSync("scripts/generate-sitemap.mjs", "utf8").includes(
    "path !== 'admin'",
  ),
  "Sitemap generator must exclude admin",
);
check(
  readFileSync(`${root}/data-access/admin-api.service.ts`, "utf8").includes(
    "transferCache: false",
  ),
  "Administrative TransferState must be off",
);
check(
  readFileSync(`${root}/auth/admin.config.ts`, "utf8").includes(
    'appId: "1:303161771474:web:6ddc9f8e0c757b25d8740b"',
  ),
  "Firebase must use the officially supplied DEV Web app",
);
check(
  /contractVersion:\s*["']1\.2\.0["']/.test(
    readFileSync(`${root}/data-access/admin.contracts.ts`, "utf8"),
  ),
  "S06 contract version must be 1.2.0",
);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `Admin architecture checks passed (${files.length} feature files): presentation boundary, strict types, CSR, no fixture imports, no storage/HTML/logs, sitemap and TransferState.`,
  );
