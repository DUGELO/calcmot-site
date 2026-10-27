import { InjectionToken } from "@angular/core";
import { environment } from "../../../environments/environment";

export type AdminEnvironment = "DEV" | "PROD";
export interface AdminConfig {
  readonly environment: AdminEnvironment;
  readonly mutationsEnabled: boolean;
  /** Public Firebase web configuration, never service-account credentials. */
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    appId: string;
  } | null;
}
// Official public DEV Web app configuration supplied by the backend owner.
// Authorization remains exclusively in /api/admin/v1; no Analytics is initialized.
const firebase: AdminConfig["firebase"] = {
  apiKey: "AIzaSyBF2KnqE4svgCRpyvsistyyGqaKenZIUb8",
  authDomain: "calcmot.firebaseapp.com",
  projectId: "calcmot",
  appId: "1:303161771474:web:6ddc9f8e0c757b25d8740b",
};
export const ADMIN_TARGETS: Readonly<Record<AdminEnvironment, AdminConfig>> = {
  DEV: { environment: "DEV", mutationsEnabled: true, firebase },
  PROD: { environment: "PROD", mutationsEnabled: true, firebase },
};
// Deliberate source/build choice, never inferred from hostname or browser storage.
// Backend session and per-operation authorization remain authoritative in both environments.
export const ADMIN_BUILD_TARGET: AdminEnvironment = environment.admin.environment;
export const ADMIN_CONFIG = new InjectionToken<AdminConfig>("ADMIN_CONFIG", {
  providedIn: "root",
  factory: () => ({
    ...ADMIN_TARGETS[ADMIN_BUILD_TARGET],
    mutationsEnabled: environment.admin.mutationsEnabled,
  }),
});
