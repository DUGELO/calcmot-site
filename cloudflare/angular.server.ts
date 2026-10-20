import { AngularAppEngine, createRequestHandler } from "@angular/ssr";

// Same neutral Angular engine used by Wrangler's Angular adapter.
// This entry is copied into an isolated deployment workspace, never src/server.ts.
const app = new AngularAppEngine({
  allowedHosts: [
    "calcmot.com.br",
    "www.calcmot.com.br",
    "localhost",
    "127.0.0.1",
  ],
});
export const reqHandler = createRequestHandler(
  async (request) =>
    (await app.handle(request)) ??
    new Response("Page not found.", { status: 404 }),
);
export default { fetch: reqHandler };
