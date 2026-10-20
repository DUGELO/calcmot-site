import { readFile, writeFile } from "node:fs/promises";
import ts from "typescript";
const source = process.argv[2];
if (!source)
  throw new Error(
    "Uso: node scripts/sync-admin-contract.mjs <backend/src/admin/contracts.ts> [--check]",
  );
const target = "src/app/admin/data-access/admin.contracts.ts";
const input = await readFile(source, "utf8");
const generated =
  "// Generated from S06-ADMIN-WEB-CONTRACT backend/src/admin/contracts.ts. Do not edit by hand.\n" +
  input;
if (process.argv.includes("--check")) {
  const tree = (text) => {
    const visit = (node) => {
      const children = [];
      node.forEachChild((child) => {
        children.push(visit(child));
      });
      return [
        node.kind,
        ...(ts.isIdentifier(node) ||
        ts.isStringLiteral(node) ||
        ts.isNumericLiteral(node)
          ? [node.text]
          : []),
        ...children,
      ];
    };
    return visit(
      ts.createSourceFile("contract.ts", text, ts.ScriptTarget.Latest, true),
    );
  };
  if (
    JSON.stringify(tree(input)) !==
    JSON.stringify(tree(await readFile(target, "utf8")))
  )
    throw new Error(
      "DTOs divergentes do contrato autoritativo. Sincronize antes de integrar.",
    );
  console.log("S06 DTO contract matches authoritative backend source.");
} else {
  await writeFile(target, generated);
  console.log(`Generated ${target}`);
}
