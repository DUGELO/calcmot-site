import { testTelemetryBoundary } from "./admin-telemetry.spec";
import "@angular/compiler";
import { testPolicyBootstrap } from "./admin-policy-bootstrap.spec";
import assert from "node:assert/strict";
import {
  DestroyRef,
  ElementRef,
  Injector,
  runInInjectionContext,
  signal,
} from "@angular/core";
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpResponse,
} from "@angular/common/http";
import {
  Observable,
  Subject,
  catchError,
  firstValueFrom,
  map,
  of,
  throwError,
} from "rxjs";
import {
  ADMIN_CONFIG,
  ADMIN_TARGETS,
  AdminConfig,
} from "../src/app/admin/auth/admin.config";
import {
  isCompatibleSession,
  sessionWritesEnabled,
} from "../src/app/admin/auth/admin-environment";
import {
  AdminApi,
  ADMIN_BACKEND,
  AdminApiError,
  AdminBackend,
  ClaimQuery,
} from "../src/app/admin/data-access/admin-api.service";
import { AdminAuth } from "../src/app/admin/auth/admin-auth.service";
import { AdminSessionService } from "../src/app/admin/auth/admin-session.service";
import { AdminWorkspaceStore } from "../src/app/admin/data-access/admin-workspace.store";
import { ReviewFormComponent } from "../src/app/admin/review/review-form.component";
import { RequestsListComponent } from "../src/app/admin/requests/requests-list.component";
import { OperationConfirmationComponent } from "../src/app/admin/review/operation-confirmation.component";
import type {
  AdminSession,
  ClaimView,
  DecisionInput,
  DecisionResult,
  EvidenceInput,
  EvidenceView,
  EventView,
  Inspection,
  IssuanceInput,
  IssuanceResult,
  MutationIntent,
  Page,
} from "../src/app/admin/data-access/admin.models";

let passed = 0;
async function test(name: string, fn: () => void | Promise<void>) {
  await fn();
  passed++;
  console.log(`OK ${name}`);
}
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const view: ClaimView = {
  claimId: "synthetic:case",
  state: "UNDER_REVIEW",
  openedAt: "2026-10-19T12:00:00Z",
  resolvedAt: null,
  provisionalUntil: null,
  revision: 0,
  serverNow: "2026-10-19T12:00:00Z",
};
const decision: DecisionInput = {
  outcome: "APPROVE",
  evidenceIds: [],
  reason: "Synthetic evidence reviewed",
  ownershipConfirmed: true,
  contradictionsCleared: true,
  legacyUseConcluded: true,
};
const emptyPage = <T>(): Page<T> => ({
  items: [],
  nextCursor: null,
  serverNow: view.serverNow,
});
const session: AdminSession = {
  contractVersion: "1.2.0",
  environment: "DEV",
  authenticated: true,
  reauthenticationRequired: false,
  reauthenticateBy: "2026-10-19T12:05:00Z",
  serverNow: view.serverNow,
};
const requests: {
  method: string;
  url: string;
  options: Record<string, unknown>;
}[] = [];
let response: Observable<unknown> = of({});
let responseEnvironment: string | null = "DEV";
let remoteSession: unknown = session;
const apiInjector = Injector.create({
  providers: [
    { provide: ADMIN_CONFIG, useValue: ADMIN_TARGETS.DEV },
    { provide: AdminAuth, useValue: { token: async () => "synthetic-token" } },
    {
      provide: HttpClient,
      useValue: {
        request: (
          method: string,
          url: string,
          options: Record<string, unknown>,
        ) => {
          requests.push({ method, url, options });
          const headers = new HttpHeaders(
            responseEnvironment === null
              ? {}
              : { "X-CalcMot-Environment": responseEnvironment },
          );
          return (url.endsWith("/session") ? of(remoteSession) : response).pipe(
            map((body) => new HttpResponse({ body, headers })),
            catchError((error: unknown) =>
              throwError(() =>
                error instanceof HttpErrorResponse
                  ? new HttpErrorResponse({
                      status: error.status,
                      error: error.error,
                      headers,
                    })
                  : error,
              ),
            ),
          );
        },
      },
    },
  ],
});
const api = runInInjectionContext(apiInjector, () => new AdminApi());
await test("HTTP boundary uses bearer, no cookies/cache/TransferState and exact protocol/cursor", async () => {
  response = of(emptyPage());
  await firstValueFrom(
    api.list({
      protocol: "synthetic:case",
      state: "UNDER_REVIEW",
      cursor: "opaque+/=",
    }),
  );
  const r = requests.at(-1)!;
  const query = new URL(r.url, "https://synthetic.invalid").searchParams;
  assert.equal(query.get("protocol"), "synthetic:case");
  assert.equal(query.get("cursor"), "opaque+/=");
  assert.equal(query.get("limit"), "10");
  assert.equal(r.options["credentials"], "omit");
  assert.equal(r.options["cache"], "no-store");
  assert.equal(r.options["redirect"], "error");
  assert.equal(r.options["transferCache"], false);
  assert.equal(r.options["observe"], "events");
  assert.equal(r.options["timeout"], 20000);
  assert.equal(
    (r.options["headers"] as Record<string, string>)["X-CalcMot-Admin"],
    "1",
  );
});
await test("Mutation headers and body preserve the same intention on retry", async () => {
  const intent = { key: "synthetic-intent", revision: 4, body: decision };
  response = of({ view });
  await firstValueFrom(api.decide(view.claimId, intent));
  await firstValueFrom(api.decide(view.claimId, intent));
  const [a, b] = requests.filter((r) => r.method === "POST").slice(-2);
  assert.deepEqual(a.options, b.options);
  assert.equal(
    (a.options["headers"] as Record<string, string>)["If-Match"],
    '"4"',
  );
  assert.equal(a.url, "/api/admin/v1/claims/synthetic%3Acase/decisions");
});
for (const [status, code] of [
  [401, "AUTH_REQUIRED"],
  [403, "FORBIDDEN"],
  [403, "REAUTH_REQUIRED"],
  [409, "CONFLICT"],
  [422, "MORE_EVIDENCE_REQUIRED"],
] as const) {
  await test(`Safe product error for ${code}`, async () => {
    response = throwError(
      () =>
        new HttpErrorResponse({
          status,
          error: {
            code,
            message: "PRIVATE RAW ERROR",
            requestId: "synthetic-request",
            retryable: false,
          },
        }),
    );
    await assert.rejects(
      firstValueFrom(api.counts()),
      (e: unknown) =>
        e instanceof AdminApiError &&
        e.code === code &&
        !e.message.includes("PRIVATE"),
    );
  });
}
await test("Network failure is recoverable without fictitious success", async () => {
  response = throwError(() => new HttpErrorResponse({ status: 0 }));
  await assert.rejects(
    firstValueFrom(api.counts()),
    (e: unknown) => e instanceof AdminApiError && e.retryable,
  );
});
await test("Path traversal identifiers never become requests", () => {
  assert.throws(() => api.detail(".."), AdminApiError);
  assert.throws(() => api.detail("<script>"), AdminApiError);
});

function apiFor(config: AdminConfig) {
  const injector = Injector.create({
    parent: apiInjector,
    providers: [{ provide: ADMIN_CONFIG, useValue: config }],
  });
  return runInInjectionContext(injector, () => new AdminApi());
}
await test("DEV supports deployed 1.2 and coordinated 1.3 sessions without accepting PROD", async () => {
  for (const version of ["1.2.0", "1.3.0"]) {
    remoteSession =
      version === "1.3.0"
        ? { ...session, contractVersion: version, mutationsEnabled: true }
        : session;
    assert.equal((await firstValueFrom(api.session())).environment, "DEV");
  }
  for (const body of [
    null,
    {},
    { ...session, environment: "PROD" },
    { ...session, environment: "UNKNOWN" },
    { ...session, contractVersion: "1.4.0" },
  ]) {
    remoteSession = body;
    await assert.rejects(firstValueFrom(api.session()), AdminApiError);
  }
  remoteSession = session;
});
await test("Missing, invalid or wrong environment headers never deliver administrative data", async () => {
  response = of({ privatePayload: "synthetic-not-for-templates" });
  for (const header of [null, "PROD", "unknown", "DEV, PROD"]) {
    responseEnvironment = header;
    let delivered = false;
    await assert.rejects(
      firstValueFrom(
        api.counts().pipe(
          map((value) => {
            delivered = true;
            return value;
          }),
        ),
      ),
      (error: unknown) =>
        error instanceof AdminApiError && error.code === "ENVIRONMENT_MISMATCH",
    );
    assert.equal(delivered, false);
  }
  responseEnvironment = "DEV";
});
await test("Error responses must also match the configured environment", async () => {
  responseEnvironment = "PROD";
  response = throwError(
    () => new HttpErrorResponse({ status: 403, error: { code: "FORBIDDEN" } }),
  );
  await assert.rejects(
    firstValueFrom(api.counts()),
    (error: unknown) =>
      error instanceof AdminApiError && error.code === "ENVIRONMENT_MISMATCH",
  );
  responseEnvironment = "DEV";
});
await test("PROD reads require 1.3 and never fall back to DEV or legacy PROD", async () => {
  const prod = apiFor(ADMIN_TARGETS.PROD);
  responseEnvironment = "PROD";
  remoteSession = {
    ...session,
    contractVersion: "1.3.0",
    environment: "PROD",
    mutationsEnabled: false,
  };
  assert.equal((await firstValueFrom(prod.session())).environment, "PROD");
  remoteSession = { ...session, environment: "PROD" };
  await assert.rejects(
    firstValueFrom(prod.session()),
    (error: unknown) =>
      error instanceof AdminApiError && error.code === "CONTRACT_MISMATCH",
  );
  responseEnvironment = "DEV";
  remoteSession = session;
  await assert.rejects(
    firstValueFrom(prod.session()),
    (error: unknown) =>
      error instanceof AdminApiError && error.code === "ENVIRONMENT_MISMATCH",
  );
});
await test("Disabled PROD build writes are blocked before token or HTTP", async () => {
  const prod = apiFor({ ...ADMIN_TARGETS.PROD, mutationsEnabled: false });
  const before = requests.length;
  const intents = [
    prod.decide(view.claimId, {
      key: "synthetic",
      revision: 0,
      body: decision,
    }),
    prod.addEvidence(view.claimId, {
      key: "synthetic",
      revision: 0,
      body: {
        kind: "AUXILIARY",
        category: "SUPPORT_RECORD",
        originKey: "synthetic",
        reference: "synthetic",
      },
    }),
    prod.issue(view.claimId, {
      key: "synthetic",
      revision: 0,
      body: {
        approvalEventId: "synthetic",
        confirmation: { claimId: view.claimId, permanentCoreOnly: true },
      },
    }),
  ];
  for (const operation of intents)
    await assert.rejects(
      firstValueFrom(operation),
      (error: unknown) =>
        error instanceof AdminApiError && error.code === "READ_ONLY",
    );
  assert.equal(requests.length, before);
});
await test("Old DEV tab binds a write to DEV and rejects a different response environment", async () => {
  responseEnvironment = "PROD";
  response = throwError(
    () =>
      new HttpErrorResponse({ status: 503, error: { code: "RETRY_LATER" } }),
  );
  await assert.rejects(
    firstValueFrom(
      api.decide(view.claimId, {
        key: "synthetic",
        revision: 0,
        body: decision,
      }),
    ),
    (error: unknown) =>
      error instanceof AdminApiError && error.code === "ENVIRONMENT_MISMATCH",
  );
  assert.equal(
    (requests.at(-1)!.options["headers"] as Record<string, string>)[
      "X-CalcMot-Expected-Environment"
    ],
    "DEV",
  );
  responseEnvironment = "DEV";
});
await test("Unknown build target fails closed before HTTP", async () => {
  const invalid = apiFor({
    ...ADMIN_TARGETS.DEV,
    environment: "UNKNOWN",
  } as unknown as AdminConfig);
  const before = requests.length;
  await assert.rejects(firstValueFrom(invalid.counts()), AdminApiError);
  assert.equal(requests.length, before);
  assert.equal(isCompatibleSession(session, "PROD"), false);
});
await test("PROD writes require both build capability and a compatible enabled server session", () => {
  const modern: AdminSession = {
    ...session,
    contractVersion: "1.3.0",
    mutationsEnabled: true,
  };
  assert.equal(sessionWritesEnabled(session, ADMIN_TARGETS.DEV), true);
  assert.equal(sessionWritesEnabled(modern, ADMIN_TARGETS.DEV), true);
  assert.equal(
    sessionWritesEnabled(
      { ...modern, mutationsEnabled: false },
      ADMIN_TARGETS.DEV,
    ),
    false,
  );
  assert.equal(
    sessionWritesEnabled(
      { ...modern, environment: "PROD" },
      ADMIN_TARGETS.PROD,
    ),
    true,
  );
  assert.equal(sessionWritesEnabled({ ...modern, environment: "PROD", mutationsEnabled: false }, ADMIN_TARGETS.PROD), false);
  assert.equal(sessionWritesEnabled({ ...modern, environment: "PROD" }, { ...ADMIN_TARGETS.PROD, mutationsEnabled: false }), false);
  assert.equal(
    isCompatibleSession({ ...session, contractVersion: "1.3.0" }, "DEV"),
    false,
  );
  assert.equal(
    isCompatibleSession({ ...modern, mutationsEnabled: "true" }, "DEV"),
    false,
  );
  assert.equal(
    isCompatibleSession({ ...session, mutationsEnabled: true }, "DEV"),
    false,
  );
});

function fixture(config: AdminConfig = ADMIN_TARGETS.DEV) {
  let current: Inspection = {
    view: { ...view },
    latestDecision: null,
    grant: null,
  };
  let failDecision = false;
  let listOverride: ((q: ClaimQuery) => Observable<Page<ClaimView>>) | null =
    null;
  const decisions: MutationIntent<DecisionInput>[] = [];
  const issues: MutationIntent<IssuanceInput>[] = [];
  const backend: AdminBackend = {
    session: () => of(session),
    counts: () =>
      of({
        counts: { UNDER_REVIEW: 1, GRANTED: 0, REJECTED: 0 },
        serverNow: view.serverNow,
      }),
    list: (q) =>
      listOverride
        ? listOverride(q)
        : of({
            items: [current.view],
            nextCursor: "opaque-next",
            serverNow: view.serverNow,
          }),
    detail: () => of(structuredClone(current)),
    evidence: () => of(emptyPage<EvidenceView>()),
    events: () => of(emptyPage<EventView>()),
    addEvidence: (_id, _intent: MutationIntent<EvidenceInput>) =>
      of({ view: current.view }),
    decide: (_id, intent) => {
      decisions.push(structuredClone(intent));
      if (failDecision) {
        failDecision = false;
        return throwError(
          () => new AdminApiError("NETWORK", "Unknown result", true),
        );
      }
      current = {
        view: {
          ...current.view,
          revision: current.view.revision + 1,
          state: intent.body.outcome === "REJECT" ? "REJECTED" : "UNDER_REVIEW",
        },
        latestDecision: {
          eventId: "synthetic-approval",
          kind: intent.body.outcome,
          basis: "ASSISTED_ASSESSMENT",
          toRevision: current.view.revision + 1,
          occurredAt: view.serverNow,
        },
        grant: null,
      };
      return of({
        view: current.view,
        decision: current.latestDecision,
      } as DecisionResult);
    },
    issue: (_id, intent) => {
      issues.push(structuredClone(intent));
      current = {
        ...current,
        view: {
          ...current.view,
          state: "GRANTED",
          revision: current.view.revision + 1,
        },
        grant: {
          legacyCoreVersionBaseline: "synthetic-core",
          grantRevision: 1,
          legacyGrantedAt: view.serverNow,
        },
      };
      return of({
        view: current.view,
        grant: current.grant,
        idempotent: false,
      } as IssuanceResult);
    },
  };
  const destroyed = new Subject<void>();
  const callbacks: (() => void)[] = [];
  const ref = {
    onDestroy: (fn: () => void) => {
      callbacks.push(fn);
      return () => {};
    },
  };
  let needsReauth = false;
  const writesEnabled = signal(true);
  const sessionState = {
    mutationsEnabled: writesEnabled,
    disableMutations: () => {
      writesEnabled.set(false);
    },
    reauthenticationRequired: () => needsReauth,
    requireReauthentication: () => {
      needsReauth = true;
    },
    ready: () => true,
    invalidated: destroyed.asObservable(),
    invalidate: (_error: AdminApiError) => destroyed.next(),
  };
  const injector = Injector.create({
    providers: [
      { provide: ADMIN_CONFIG, useValue: config },
      { provide: DestroyRef, useValue: ref },
      { provide: ADMIN_BACKEND, useValue: backend },
      { provide: AdminSessionService, useValue: sessionState },
    ],
  });
  const store = runInInjectionContext(
    injector,
    () => new AdminWorkspaceStore(),
  );
  return {
    store,
    backend,
    injector,
    decisions,
    issues,
    failDecision: () => (failDecision = true),
    disableWrites: () => {
      writesEnabled.set(false);
    },
    freshAuthentication: () => {
      needsReauth = false;
    },
    expireAuthentication: () => { needsReauth = true; },
    setList: (fn: (q: ClaimQuery) => Observable<Page<ClaimView>>) =>
      (listOverride = fn),
    invalidate: () => destroyed.next(),
    destroy: () => callbacks.forEach((fn) => fn()),
  };
}
await test("PROD capability never bypasses expired authentication or replays an intent", async () => {
  const f = fixture(ADMIN_TARGETS.PROD);
  await f.store.open(view.claimId);
  f.store.prepareDecision(decision);
  f.expireAuthentication();
  await f.store.execute();
  assert.equal(f.decisions.length, 0);
  assert.ok(f.store.pending());
  f.freshAuthentication();
  assert.equal(f.decisions.length, 0);
  await f.store.execute();
  assert.equal(f.decisions.length, 1);
  assert.equal(f.issues.length, 0);
  f.destroy();
});
await test("Approval updates authoritative revision without issuing grant", async () => {
  const f = fixture();
  await f.store.open(view.claimId);
  f.store.prepareDecision(decision);
  assert.equal(f.decisions.length, 0);
  await f.store.execute();
  assert.equal(f.decisions.length, 1);
  assert.equal(f.issues.length, 0);
  assert.equal(f.store.detail()!.view.state, "UNDER_REVIEW");
  assert.equal(f.store.detail()!.grant, null);
  assert.equal(f.store.showIssuance(), true);
  f.store.detail.update((d) => ({
    ...d!,
    view: { ...d!.view, revision: d!.view.revision + 1 },
  }));
  assert.equal(f.store.showIssuance(), false);
  f.destroy();
});
await test("Issuance is a separate intention tied to approval/revision", async () => {
  const f = fixture();
  await f.store.open(view.claimId);
  f.store.prepareDecision(decision);
  await f.store.execute();
  f.store.prepareIssuance();
  assert.equal(f.issues.length, 0);
  await f.store.execute();
  assert.equal(f.issues.length, 1);
  assert.equal(f.issues[0].revision, 1);
  assert.equal(f.issues[0].body.approvalEventId, "synthetic-approval");
  assert.equal(f.store.detail()!.view.state, "GRANTED");
  f.destroy();
});
await test("Retry preserves the original body, revision and idempotency key", async () => {
  const f = fixture();
  await f.store.open(view.claimId);
  f.store.prepareDecision(decision);
  f.failDecision();
  await f.store.execute();
  assert.equal(f.store.pending()?.kind, "decision");
  assert.equal(f.store.detail()!.view.revision, 0);
  await f.store.execute();
  assert.deepEqual(f.decisions[0], f.decisions[1]);
  f.destroy();
});
await test("Rejection never issues a grant", async () => {
  const f = fixture();
  await f.store.open(view.claimId);
  f.store.prepareDecision({ ...decision, outcome: "REJECT" });
  await f.store.execute();
  assert.equal(f.store.detail()!.view.state, "REJECTED");
  assert.equal(f.issues.length, 0);
  f.destroy();
});
await test("Rapid filters cancel previous requests and ignore stale results", () => {
  const f = fixture();
  const old = new Subject<Page<ClaimView>>();
  const latest = new Subject<Page<ClaimView>>();
  let cancelled = false;
  f.setList((q) =>
    q.protocol === "old"
      ? new Observable((sub) => {
          const inner = old.subscribe(sub);
          return () => {
            cancelled = true;
            inner.unsubscribe();
          };
        })
      : latest,
  );
  f.store.search({ protocol: "old" });
  f.store.search({ protocol: "latest" });
  assert.equal(cancelled, true);
  old.next({
    items: [{ ...view, claimId: "old" }],
    nextCursor: null,
    serverNow: view.serverNow,
  });
  old.complete();
  latest.next({
    items: [{ ...view, claimId: "latest" }],
    nextCursor: null,
    serverNow: view.serverNow,
  });
  latest.complete();
  assert.equal(f.store.claims()[0].claimId, "latest");
  assert.equal(f.store.page(), 1);
  f.destroy();
});
await test("Duplicate active list requests are not sent twice", () => {
  const f = fixture();
  const pending = new Subject<Page<ClaimView>>();
  let calls = 0;
  f.setList(() => {
    calls++;
    return pending;
  });
  f.store.search({ protocol: "same" });
  f.store.search({ protocol: "same" });
  assert.equal(calls, 1);
  f.destroy();
});
await test("Failed pagination preserves visible page and data", () => {
  const f = fixture();
  f.store.load();
  f.setList(() =>
    throwError(() => new AdminApiError("NETWORK", "Offline", true)),
  );
  f.store.paginate(true);
  assert.equal(f.store.page(), 1);
  assert.equal(f.store.claims().length, 1);
  f.destroy();
});
await test("Session invalidation clears private data, drafts and pending confirmation", async () => {
  const f = fixture();
  f.store.load();
  await f.store.open(view.claimId);
  f.store.prepareDecision(decision);
  f.invalidate();
  assert.equal(f.store.detail(), null);
  assert.deepEqual(f.store.claims(), []);
  assert.deepEqual(f.store.evidence(), []);
  assert.deepEqual(f.store.events(), []);
  assert.equal(f.store.pending(), null);
  f.destroy();
});
await test("Late mutation response after session invalidation is ignored", async () => {
  const f = fixture();
  await f.store.open(view.claimId);
  const pending = new Subject<DecisionResult>();
  f.backend.decide = () => pending;
  f.store.prepareDecision(decision);
  const execution = f.store.execute();
  f.invalidate();
  pending.next({
    view: { ...view, revision: 1 },
    decision: {
      eventId: "late",
      kind: "APPROVE",
      basis: "ASSISTED_ASSESSMENT",
      toRevision: 1,
      occurredAt: view.serverNow,
    },
  });
  pending.complete();
  await execution;
  assert.equal(f.store.detail(), null);
  assert.equal(f.store.notice(), "");
  f.destroy();
});
await test("Rejected case reopens only through an explicitly confirmed REQUEST_MORE", async () => {
  const f = fixture();
  await f.store.open(view.claimId);
  f.store.prepareDecision({ ...decision, outcome: "REJECT" });
  await f.store.execute();
  const revision = f.store.detail()!.view.revision;
  for (const outcome of ["APPROVE", "REJECT", "OWNERSHIP_CONFLICT"] as const) {
    f.store.prepareDecision({ ...decision, outcome });
    assert.equal(f.store.pending(), null);
  }
  f.store.prepareDecision({ ...decision, outcome: "REQUEST_MORE" });
  assert.equal(f.decisions.length, 1);
  assert.equal(f.store.pending()!.intent.revision, revision);
  f.store.cancel();
  await f.store.execute();
  assert.equal(f.decisions.length, 1);
  assert.equal(f.store.detail()!.view.state, "REJECTED");
  f.store.prepareDecision({ ...decision, outcome: "REQUEST_MORE" });
  await f.store.execute();
  assert.equal(f.store.detail()!.view.state, "UNDER_REVIEW");
  assert.equal(f.store.detail()!.view.revision, revision + 1);
  assert.equal(f.store.detail()!.grant, null);
  assert.equal(f.issues.length, 0);
  f.destroy();
});
await test("Reopening preserves intent across reauthentication without replay", async () => {
  const f = fixture();
  await f.store.open(view.claimId);
  f.store.prepareDecision({ ...decision, outcome: "REJECT" });
  await f.store.execute();
  f.store.prepareDecision({ ...decision, outcome: "REQUEST_MORE" });
  const original = f.backend.decide;
  f.backend.decide = () =>
    throwError(() => new AdminApiError("REAUTH_REQUIRED", "Confirm identity"));
  await f.store.execute();
  const pending = f.store.pending();
  await f.store.execute();
  f.freshAuthentication();
  f.store.dismissError();
  assert.equal(f.decisions.length, 1);
  assert.equal(f.store.detail()!.view.state, "REJECTED");
  assert.deepEqual(f.store.pending(), pending);
  f.backend.decide = original;
  await f.store.execute();
  assert.deepEqual(f.decisions[1], pending!.intent);
  assert.equal(f.store.detail()!.view.state, "UNDER_REVIEW");
  assert.equal(f.issues.length, 0);
  f.destroy();
});
await test("Granted cases never prepare reopening or other decisions", async () => {
  const f = fixture();
  await f.store.open(view.claimId);
  f.store.prepareDecision(decision);
  await f.store.execute();
  f.store.prepareIssuance();
  await f.store.execute();
  for (const outcome of [
    "REQUEST_MORE",
    "APPROVE",
    "REJECT",
    "OWNERSHIP_CONFLICT",
  ] as const) {
    f.store.prepareDecision({ ...decision, outcome });
    assert.equal(f.store.pending(), null);
  }
  assert.equal(f.decisions.length, 1);
  assert.equal(f.store.detail()!.view.state, "GRANTED");
  assert.ok(f.store.detail()!.grant);
  f.store.detail.update((d) =>
    d ? { ...d, view: { ...d.view, state: "REJECTED" } } : null,
  );
  f.store.prepareDecision({ ...decision, outcome: "REQUEST_MORE" });
  assert.equal(f.store.pending(), null);
  assert.equal(f.decisions.length, 1);
  f.destroy();
});
await test("Reopening form emits only REQUEST_MORE and a justified reason", () => {
  const injector = Injector.create({
    providers: [{ provide: ADMIN_CONFIG, useValue: ADMIN_TARGETS.DEV }],
  });
  const form = runInInjectionContext(injector, () => new ReviewFormComponent());
  Object.defineProperty(form, "mode", { value: () => "reopen" });
  const emitted: DecisionInput[] = [];
  form.review.subscribe((body) => emitted.push(body));
  form.submit();
  assert.equal(emitted.length, 0);
  form.form.patchValue({
    outcome: "APPROVE",
    reason: "Reavaliar contexto sintético",
    ownershipConfirmed: true,
  });
  form.submit();
  assert.deepEqual(emitted, [
    {
      outcome: "REQUEST_MORE",
      reason: "Reavaliar contexto sintético",
      evidenceIds: [],
      ownershipConfirmed: false,
      contradictionsCleared: false,
      legacyUseConcluded: false,
    },
  ]);
});
await test("Read-only policy cancels pending write and prevents preparing other writes", async () => {
  const f = fixture();
  await f.store.open(view.claimId);
  f.store.prepareDecision(decision);
  f.disableWrites();
  await f.store.execute();
  assert.equal(f.decisions.length, 0);
  assert.equal(f.store.pending(), null);
  assert.equal(f.store.error()?.code, "READ_ONLY");
  f.store.prepareEvidence({
    kind: "AUXILIARY",
    category: "SUPPORT_RECORD",
    originKey: "synthetic",
    reference: "synthetic",
  });
  f.store.prepareDecision(decision);
  assert.equal(f.store.pending(), null);
  f.destroy();
});
await test("Environment mismatch invalidates session and clears private data and intent", async () => {
  const f = fixture();
  await f.store.open(view.claimId);
  f.store.prepareDecision(decision);
  f.backend.counts = () =>
    throwError(
      () => new AdminApiError("ENVIRONMENT_MISMATCH", "Different environment"),
    );
  f.store.load();
  assert.equal(f.store.detail(), null);
  assert.equal(f.store.pending(), null);
  assert.deepEqual(f.store.claims(), []);
  assert.deepEqual(f.store.evidence(), []);
  assert.deepEqual(f.store.events(), []);
  f.destroy();
});
await test("Presentational review validates locally with no API provider", () => {
  const injector = Injector.create({
    providers: [{ provide: ADMIN_CONFIG, useValue: ADMIN_TARGETS.DEV }],
  });
  const form = runInInjectionContext(injector, () => new ReviewFormComponent());
  let emitted = false;
  form.review.subscribe(() => (emitted = true));
  form.submit();
  assert.equal(form.form.invalid, true);
  assert.equal(emitted, false);
});
await test("Presentational filters reject invalid protocol without API provider", () => {
  const injector = Injector.create({
    providers: [{ provide: ADMIN_CONFIG, useValue: ADMIN_TARGETS.DEV }],
  });
  const list = runInInjectionContext(
    injector,
    () => new RequestsListComponent(),
  );
  let emitted = false;
  list.search.subscribe(() => (emitted = true));
  list.filters.patchValue({ protocol: "invalid protocol" });
  list.applyFilters();
  assert.equal(emitted, false);
});
await test("Confirmation requires an explicit checkbox without backend access", () => {
  const injector = Injector.create({
    providers: [
      { provide: ADMIN_CONFIG, useValue: ADMIN_TARGETS.DEV },
      {
        provide: ElementRef,
        useValue: { nativeElement: { querySelector: () => null } },
      },
    ],
  });
  const dialog = runInInjectionContext(
    injector,
    () => new OperationConfirmationComponent(),
  );
  let calls = 0;
  dialog.accepted.subscribe(() => calls++);
  dialog.submit();
  assert.equal(calls, 0);
  dialog.confirmed = true;
  dialog.submit();
  assert.equal(calls, 1);
});
await test("Session state combines explicit target and backend write policy without environment fallback", async () => {
  for (const [config, body, expectedReady, expectedWrites] of [
    [ADMIN_TARGETS.DEV, session, true, true],
    [
      ADMIN_TARGETS.DEV,
      { ...session, contractVersion: "1.3.0", mutationsEnabled: false },
      true,
      false,
    ],
    [
      ADMIN_TARGETS.DEV,
      { ...session, contractVersion: "1.3.0", mutationsEnabled: true },
      true,
      true,
    ],
    [
      ADMIN_TARGETS.PROD,
      {
        ...session,
        contractVersion: "1.3.0",
        environment: "PROD",
        mutationsEnabled: false,
      },
      true,
      false,
    ],
    [ADMIN_TARGETS.PROD, session, false, false],
    [ADMIN_TARGETS.PROD, { ...session, contractVersion: "1.3.0", environment: "PROD", mutationsEnabled: true }, true, true],
    [
      ADMIN_TARGETS.DEV,
      {
        ...session,
        contractVersion: "1.3.0",
        environment: "PROD",
        mutationsEnabled: false,
      },
      false,
      false,
    ],
  ] as const) {
    const callbacks: (() => void)[] = [];
    const injector = Injector.create({
      providers: [
        { provide: ADMIN_CONFIG, useValue: config },
        {
          provide: DestroyRef,
          useValue: { onDestroy: (fn: () => void) => callbacks.push(fn) },
        },
        {
          provide: AdminAuth,
          useValue: { login: async () => {}, logout: async () => {} },
        },
        { provide: ADMIN_BACKEND, useValue: { session: () => of(body) } },
      ],
    });
    const state = runInInjectionContext(
      injector,
      () => new AdminSessionService(),
    );
    await state.login();
    assert.equal(state.ready(), expectedReady);
    assert.equal(state.mutationsEnabled(), expectedWrites);
    assert.equal(
      state.environment(),
      expectedReady ? config.environment : null,
    );
    state.invalidate();
    callbacks.forEach((fn) => fn());
  }
});
await test("Stale recent-auth deadline permits reading and marks mutations for reauthentication", async () => {
  let invalidated = 0;
  const callbacks: (() => void)[] = [];
  const injector = Injector.create({
    providers: [
      { provide: ADMIN_CONFIG, useValue: ADMIN_TARGETS.DEV },
      {
        provide: DestroyRef,
        useValue: { onDestroy: (fn: () => void) => callbacks.push(fn) },
      },
      {
        provide: AdminAuth,
        useValue: { login: async () => {}, logout: async () => {} },
      },
      {
        provide: ADMIN_BACKEND,
        useValue: {
          session: () => of({ ...session, reauthenticationRequired: true }),
        },
      },
    ],
  });
  const state = runInInjectionContext(
    injector,
    () => new AdminSessionService(),
  );
  state.invalidated.subscribe(() => invalidated++);
  await state.login();
  assert.equal(state.ready(), true);
  assert.equal(state.reauthenticationRequired(), true);
  assert.equal(state.error(), null);
  assert.equal(invalidated, 0);
  callbacks.forEach((fn) => fn());
});
await test("REAUTH_REQUIRED preserves the case and intent without automatically executing it", async () => {
  const f = fixture();
  await f.store.open(view.claimId);
  f.store.prepareDecision(decision);
  let calls = 0;
  const original = f.backend.decide;
  f.backend.decide = () => {
    calls++;
    return throwError(
      () => new AdminApiError("REAUTH_REQUIRED", "Confirm identity"),
    );
  };
  await f.store.execute();
  const intention = f.store.pending();
  assert.ok(f.store.detail());
  assert.ok(intention);
  assert.equal(calls, 1);
  await f.store.execute();
  assert.equal(calls, 1);
  f.freshAuthentication();
  f.store.dismissError();
  assert.equal(calls, 1);
  f.backend.decide = original;
  await f.store.execute();
  assert.deepEqual(f.decisions[0], intention!.intent);
  f.destroy();
});
await test("Cancelling Google reauthentication preserves reading and logout clears locally before SDK resolves", async () => {
  const callbacks: (() => void)[] = [];
  let calls = 0;
  let release: (() => void) | undefined;
  const injector = Injector.create({
    providers: [
      { provide: ADMIN_CONFIG, useValue: ADMIN_TARGETS.DEV },
      {
        provide: DestroyRef,
        useValue: { onDestroy: (fn: () => void) => callbacks.push(fn) },
      },
      {
        provide: AdminAuth,
        useValue: {
          login: async () => {
            if (++calls === 2) throw { code: "auth/popup-closed-by-user" };
          },
          logout: () =>
            new Promise<void>((resolve) => {
              release = resolve;
            }),
        },
      },
      {
        provide: ADMIN_BACKEND,
        useValue: {
          session: () => of({ ...session, reauthenticationRequired: true }),
        },
      },
    ],
  });
  const state = runInInjectionContext(
    injector,
    () => new AdminSessionService(),
  );
  await state.login();
  assert.equal(state.ready(), true);
  assert.equal(await state.reauthenticate(), false);
  assert.equal(state.ready(), true);
  assert.equal(state.error()?.code, "CANCELLED");
  const leaving = state.logout();
  assert.equal(state.ready(), false);
  release?.();
  await leaving;
  callbacks.forEach((fn) => fn());
});
await test("A denied account can start a new Google login before reauthentication of an authorized session", async () => {
  const modes: boolean[] = [];
  let checks = 0;
  const injector = Injector.create({
    providers: [
      { provide: ADMIN_CONFIG, useValue: ADMIN_TARGETS.DEV },
      { provide: DestroyRef, useValue: { onDestroy: () => {} } },
      {
        provide: AdminAuth,
        useValue: {
          login: async (reauth: boolean) => {
            modes.push(reauth);
          },
        },
      },
      {
        provide: ADMIN_BACKEND,
        useValue: {
          session: () =>
            ++checks === 1
              ? throwError(
                  () => new AdminApiError("FORBIDDEN", "Account denied"),
                )
              : of({ ...session, reauthenticationRequired: true }),
        },
      },
    ],
  });
  const state = runInInjectionContext(
    injector,
    () => new AdminSessionService(),
  );
  await state.login();
  assert.equal(state.ready(), false);
  assert.equal(state.error()?.code, "FORBIDDEN");
  await state.login();
  assert.equal(state.ready(), true);
  await state.reauthenticate();
  assert.deepEqual(modes, [false, false, true]);
  state.invalidate();
});
await test(
  "Public monitoring is isolated from administration",
  testTelemetryBoundary,
);
await test("Private policy handoff requires challenge, consent and fresh identity without replay", testPolicyBootstrap);
await tick();
console.log(`${passed} administrative tests passed. Synthetic fixtures only.`);
