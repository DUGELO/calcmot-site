import angular from "../dist/calcmot-cloudflare/server/server.mjs";
import { withAdminRouting } from "./admin-routing.mjs";
import { adminEnvironment } from "../dist/calcmot-cloudflare/admin-environment.mjs";
export default withAdminRouting(angular, adminEnvironment);
