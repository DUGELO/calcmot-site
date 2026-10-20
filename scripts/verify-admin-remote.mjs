import assert from "node:assert/strict";

// Anonymous read-only probes. Never supplies a real token or sends a mutation.
const endpoint = "https://calcmot.com.br/api/admin/v1/session";
for (const [name, headers, status] of [
  [
    "anonymous canonical client",
    { Origin: "https://calcmot.com.br", "X-CalcMot-Admin": "1" },
    401,
  ],
  [
    "invalid bearer",
    {
      Origin: "https://calcmot.com.br",
      "X-CalcMot-Admin": "1",
      Authorization: "Bearer invalid-test-token",
    },
    401,
  ],
  [
    "foreign origin",
    { Origin: "https://untrusted.invalid", "X-CalcMot-Admin": "1" },
    403,
  ],
  ["missing marker", { Origin: "https://calcmot.com.br" }, 403],
]) {
  const response = await fetch(endpoint, {
    headers,
    redirect: "error",
    cache: "no-store",
  });
  assert.equal(response.status, status, name);
  assert.match(response.headers.get("Cache-Control"), /no-store/i);
  assert.match(response.headers.get("X-Robots-Tag"), /noindex/i);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
  assert.match(response.headers.get("Content-Type"), /application\/json/);
  const body = await response.json();
  assert.ok(["AUTH_REQUIRED", "FORBIDDEN"].includes(body.code));
  console.log(`${name}: ${response.status}; JSON; no-store/noindex; no CORS`);
}
console.log(
  "Read-only remote negatives passed. Node diagnostic only, not same-origin Angular browser E2E.",
);
