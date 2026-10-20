import angular from "../dist/calcmot-cloudflare/server/server.mjs";
import { withAdminRouting } from "./admin-routing.mjs";
export default withAdminRouting(angular);
