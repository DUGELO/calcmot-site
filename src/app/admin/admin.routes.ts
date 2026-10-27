import type { Routes } from "@angular/router";
import { provideHttpClient, withFetch } from "@angular/common/http";
import { AdminApi, ADMIN_BACKEND } from "./data-access/admin-api.service";
import { AdminWorkspaceStore } from "./data-access/admin-workspace.store";
import { AdminAuth } from "./auth/admin-auth.service";
import { AdminSessionService } from "./auth/admin-session.service";
import { AdminPolicyBootstrap } from "./auth/admin-policy-bootstrap.service";
export const ADMIN_ROUTES: Routes = [
  {
    path: "",
    providers: [
      provideHttpClient(withFetch()),
      AdminApi,
      { provide: ADMIN_BACKEND, useExisting: AdminApi },
      AdminAuth,
      AdminSessionService,
      AdminPolicyBootstrap,
      AdminWorkspaceStore,
    ],
    loadComponent: () =>
      import("./admin.component").then((m) => m.AdminComponent),
    children: [
      {
        path: "",
        pathMatch: "full",
        data: { overview: true },
        loadComponent: () =>
          import("./requests/requests-page.component").then(
            (m) => m.RequestsPageComponent,
          ),
      },
      {
        path: "solicitacoes",
        loadComponent: () =>
          import("./requests/requests-page.component").then(
            (m) => m.RequestsPageComponent,
          ),
      },
      {
        path: "solicitacoes/:claimId",
        loadComponent: () =>
          import("./requests/request-details-page.component").then(
            (m) => m.RequestDetailsPageComponent,
          ),
      },
      { path: "**", redirectTo: "" },
    ],
  },
];
