import angular from "../dist/calcmot-cloudflare/server/server.mjs";
import { withAdminRouting } from "./admin-routing.mjs";
import { adminEnvironment } from "../dist/calcmot-cloudflare/admin-environment.mjs";
import { handleAuditorRequest, handleAuditorConfig } from "./auditor-api.mjs";
// This explicit path avoids the existing /api namespace (owned by gateway).
const siteHandler=withAdminRouting(angular,adminEnvironment);
export default {
  async fetch(request,env,context) {
    if (new URL(request.url).pathname==='/auditor-interno/config')
      return handleAuditorConfig(request,env);
    if (new URL(request.url).pathname==='/auditor-interno/analisar')
      return handleAuditorRequest(request,env);
    return siteHandler.fetch(request,env,context);
  }
};
