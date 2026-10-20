import { InjectionToken } from "@angular/core";

export interface AdminConfig {
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
export const ADMIN_CONFIG = new InjectionToken<AdminConfig>("ADMIN_CONFIG", {
  providedIn: "root",
  factory: () => ({
    firebase: {
      apiKey: "AIzaSyBF2KnqE4svgCRpyvsistyyGqaKenZIUb8",
      authDomain: "calcmot.firebaseapp.com",
      projectId: "calcmot",
      appId: "1:303161771474:web:6ddc9f8e0c757b25d8740b",
    },
  }),
});
