import { Component } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideRouter, RouterLink, RouterOutlet } from "@angular/router";
import { defer, delay, of, throwError } from "rxjs";
import { ADMIN_ROUTES } from "../src/app/admin/admin.routes";
import {
  ADMIN_BACKEND,
  AdminApiError,
  AdminBackend,
} from "../src/app/admin/data-access/admin-api.service";
import { AdminAuth } from "../src/app/admin/auth/admin-auth.service";
import {
  ADMIN_CONFIG,
  ADMIN_TARGETS,
} from "../src/app/admin/auth/admin.config";
import type {
  Inspection,
  AdminSession,
  EvidenceView,
  EventView,
  DecisionInput,
  IssuanceInput,
  EvidenceInput,
  MutationIntent,
  DecisionResult,
  IssuanceResult,
} from "../src/app/admin/data-access/admin.models";

const scenario = new URLSearchParams(location.search).get("scenario");
const target = ["prod-readonly", "policy-handoff"].includes(scenario ?? "") ? "PROD" : "DEV";
// Test-only browser origin facade. The production service keeps its official-origin guard.
const policyDocument = new Proxy(document, {
  get(target, property) {
    if (property === "defaultView") return new Proxy(window, {
      get(view, key) {
        if (key === "location") return {
          get hash() { return location.hash; }, get pathname() { return location.pathname; },
          get search() { return location.search; }, origin: "https://calcmot.com.br",
        };
        const value = Reflect.get(view, key, view);
        return typeof value === "function" ? value.bind(view) : value;
      },
    });
    const value = Reflect.get(target, property, target);
    return typeof value === "function" ? value.bind(target) : value;
  },
});
const now = () => new Date().toISOString();
const claims: Inspection[] = Array.from({ length: 23 }, (_, i) => ({
  view: {
    claimId: `DEMO-2026-${1048 - i}`,
    state: i % 7 === 5 ? "GRANTED" : i % 7 === 6 ? "REJECTED" : "UNDER_REVIEW",
    openedAt: new Date(
      Date.UTC(2026, 9, 19, 14, 32) - i * 3600000,
    ).toISOString(),
    resolvedAt: null,
    provisionalUntil: null,
    revision: 0,
    serverNow: now(),
  },
  latestDecision: null,
  grant:
    i % 7 === 5
      ? {
          legacyCoreVersionBaseline: "synthetic-core",
          grantRevision: 1,
          legacyGrantedAt: now(),
        }
      : null,
}));
const find = (id: string) => {
  const claim = claims.find((c) => c.view.claimId === id);
  if (!claim)
    throw new AdminApiError(
      "NOT_FOUND",
      "Não encontramos este pedido sintético.",
    );
  return claim;
};
const evidenceMap = new Map<string, EvidenceView[]>();
const eventsMap = new Map<string, EventView[]>();
const evidence = (id: string) => {
  if (!evidenceMap.has(id))
    evidenceMap.set(id, [
      {
        evidenceId: "synthetic-support",
        kind: "AUXILIARY",
        category: "SUPPORT_RECORD",
        originKey: "synthetic-support",
        reference: "synthetic:case-support",
        addedAt: now(),
      },
    ]);
  return evidenceMap.get(id)!;
};
const events = (id: string) => {
  if (!eventsMap.has(id)) eventsMap.set(id, []);
  return eventsMap.get(id)!;
};
const response = <T>(fn: () => T) =>
  defer(() => of(structuredClone(fn()))).pipe(
    delay(scenario === "loading" ? 3000 : 180),
  );
const event = (id: string, kind: EventView["kind"], reason?: string) => {
  const claim = find(id);
  const fromRevision = claim.view.revision++;
  const record: EventView = {
    eventId: `synthetic-${id}-${claim.view.revision}`,
    kind,
    basis: "ASSISTED_ASSESSMENT",
    actor: "OWNER",
    occurredAt: now(),
    fromRevision,
    toRevision: claim.view.revision,
    details: reason ? { reason } : {},
  };
  events(id).push(record);
  return record;
};
const receipts = new Map<
  string,
  DecisionResult | IssuanceResult | { view: Inspection["view"] }
>();
let sessionChecks = 0;
const fixture: AdminBackend = {
  session: () => {
    if (scenario === "forbidden")
      return throwError(
        () =>
          new AdminApiError(
            "FORBIDDEN",
            "Esta conta não tem autorização para acessar o painel.",
          ),
      );
    const reauthenticationRequired =
      scenario === "reauth" && sessionChecks++ === 0;
    const common = {
      authenticated: true,
      reauthenticationRequired,
      reauthenticateBy: new Date(
        Date.now() + (reauthenticationRequired ? -1000 : 300000),
      ).toISOString(),
      serverNow: now(),
    } as const;
    const session: AdminSession =
      target === "PROD"
        ? {
            ...common,
            contractVersion: "1.3.0",
            environment: "PROD",
            mutationsEnabled: false,
          }
        : { ...common, contractVersion: "1.2.0", environment: "DEV" };
    return of(session);
  },
  counts: () =>
    scenario === "error"
      ? throwError(
          () =>
            new AdminApiError(
              "RETRY_LATER",
              "O serviço está temporariamente indisponível. Tente novamente mais tarde.",
              true,
            ),
        )
      : response(() => ({
          counts: {
            UNDER_REVIEW: claims.filter((c) => c.view.state === "UNDER_REVIEW")
              .length,
            GRANTED: claims.filter((c) => c.view.state === "GRANTED").length,
            REJECTED: claims.filter((c) => c.view.state === "REJECTED").length,
          },
          serverNow: now(),
        })),
  list: (q) =>
    response(() => {
      const filtered = claims.filter(
        (c) =>
          (!q.protocol || c.view.claimId === q.protocol) &&
          (!q.state || c.view.state === q.state),
      );
      const start = Number(q.cursor ?? 0);
      return {
        items:
          scenario === "empty"
            ? []
            : filtered.slice(start, start + 10).map((c) => c.view),
        nextCursor: start + 10 < filtered.length ? String(start + 10) : null,
        serverNow: now(),
      };
    }),
  detail: (id) => response(() => find(id)),
  evidence: (id) =>
    response(() => ({
      items: evidence(id),
      nextCursor: null,
      serverNow: now(),
    })),
  events: (id) =>
    response(() => ({ items: events(id), nextCursor: null, serverNow: now() })),
  addEvidence: (id, intent: MutationIntent<EvidenceInput>) =>
    response(() => {
      if (receipts.has(intent.key))
        return receipts.get(intent.key) as { view: Inspection["view"] };
      const record = event(id, "EVIDENCE_ADDED");
      evidence(id).push({
        ...intent.body,
        evidenceId: record.eventId,
        addedAt: now(),
      });
      const result = { view: find(id).view };
      receipts.set(intent.key, structuredClone(result));
      return result;
    }),
  decide: (id, intent: MutationIntent<DecisionInput>) =>
    response(() => {
      if (scenario === "conflict")
        throw new AdminApiError(
          "CONFLICT",
          "Este pedido foi atualizado. Recarregue os dados antes de tomar uma nova decisão.",
        );
      if (receipts.has(intent.key))
        return receipts.get(intent.key) as DecisionResult;
      const c = find(id);
      const e = event(id, intent.body.outcome, intent.body.reason);
      c.latestDecision = {
        eventId: e.eventId,
        kind: intent.body.outcome,
        basis: e.basis,
        toRevision: e.toRevision,
        occurredAt: e.occurredAt,
      };
      if (intent.body.outcome === "REJECT") c.view.state = "REJECTED";
      if (intent.body.outcome === "REQUEST_MORE") c.view.state = "UNDER_REVIEW";
      const result = { view: c.view, decision: c.latestDecision };
      receipts.set(intent.key, structuredClone(result));
      return result;
    }),
  issue: (id, intent: MutationIntent<IssuanceInput>) =>
    response(() => {
      if (receipts.has(intent.key))
        return {
          ...(receipts.get(intent.key) as IssuanceResult),
          idempotent: true,
        };
      const c = find(id);
      event(id, "GRANT_ISSUED");
      c.view.state = "GRANTED";
      c.grant = {
        legacyCoreVersionBaseline: "synthetic-core",
        grantRevision: 1,
        legacyGrantedAt: now(),
      };
      const result = { view: c.view, grant: c.grant, idempotent: false };
      receipts.set(intent.key, structuredClone(result));
      return result;
    }),
};
const routes = ADMIN_ROUTES.map((route) => ({
  ...route,
  path: "admin",
  providers: [
    ...(route.providers ?? []),
    { provide: ADMIN_CONFIG, useValue: ADMIN_TARGETS[target] },
    { provide: ADMIN_BACKEND, useValue: fixture },
    ...(scenario === "policy-handoff" ? [{ provide: DOCUMENT, useValue: policyDocument }] : []),
    {
      provide: AdminAuth,
      useValue: {
        configured: true,
        state: () => "ready",
        prepare: async () => {},
        login: async () => {},
        logout: async () => {},
      },
    },
  ],
}));
@Component({
  selector: "app-prototype",
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `<div
      style="padding:12px 20px;background:#282415;color:#eddda5;font:12px system-ui;text-align:center"
    >
      Protótipo local de teste · Dados sintéticos · Sem conexão com serviços
      reais
    </div>
    @if (policyScenario) {
      <a id="synthetic-handoff" [href]="handoff">Abrir handoff sintético nesta aba</a>
      <a [routerLink]="['/admin']" [queryParams]="{scenario: 'policy-handoff'}"
        [fragment]="routerFragment">Abrir handoff pelo Router</a>
    }
    <main id="conteudo"><router-outlet /></main>`,
})
class PrototypeRoot {
  readonly policyScenario = scenario === "policy-handoff";
  readonly handoff = "/admin?scenario=policy-handoff#policy-bootstrap=8971." + "a".repeat(64);
  readonly routerFragment = "policy-bootstrap=8971." + "b".repeat(64);
}
bootstrapApplication(PrototypeRoot, { providers: [provideRouter(routes)] });
