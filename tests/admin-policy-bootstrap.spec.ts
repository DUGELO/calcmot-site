import assert from "node:assert/strict";
import { DOCUMENT } from "@angular/common";
import { DestroyRef, Injector, runInInjectionContext, signal } from "@angular/core";
import { Subject } from "rxjs";
import { NavigationEnd, Router } from "@angular/router";
import { ADMIN_CONFIG, ADMIN_TARGETS } from "../src/app/admin/auth/admin.config";
import { AdminSessionService } from "../src/app/admin/auth/admin-session.service";
import { AdminPolicyBootstrap } from "../src/app/admin/auth/admin-policy-bootstrap.service";

export async function testPolicyBootstrap(): Promise<void> {
  const nonce = "a".repeat(64);
  const challenge = { protocolVersion: 1, environment: "PROD", policyVersion: "legacy-through-3.5-vc12", grantsWritten: 0 };
  const receipt = { ...challenge, policyOnly: true, operationId: "policy-" + "b".repeat(24), policyRecordedAt: "2026-10-27T15:00:00Z" };
  const originalFetch = globalThis.fetch;
  const originalNow = Date.now;
  const create = (hash = "#policy-bootstrap=8971." + nonce, target = "PROD", origin = "https://calcmot.com.br") => {
    const invalidated = new Subject<void>();
    const calls: string[] = [];
    const session = { ready: signal(true), environment: signal("PROD"), invalidated,
      reauthenticate: async () => { calls.push("reauth"); return true; },
      auth: { token: async () => { calls.push("token"); return "synthetic-sdk-token"; } } };
    const history: string[] = [];
    const events = new Subject<NavigationEnd>();
    const location = { hash, origin, pathname: "/admin", search: "" };
    const listeners = new Map<string, () => void>();
    const destroyed: (() => void)[] = [];
    const injector = Injector.create({ providers: [
      { provide: DOCUMENT, useValue: { defaultView: { location,
        addEventListener: (name: string, listener: () => void) => listeners.set(name, listener),
        removeEventListener: (name: string) => listeners.delete(name),
        history: { state: {}, replaceState: (_state: unknown, _title: string, path: string) => { history.push(path); location.hash = ""; } } } } },
      { provide: Router, useValue: { events } },
      { provide: ADMIN_CONFIG, useValue: target === "PROD" ? ADMIN_TARGETS.PROD : ADMIN_TARGETS.DEV },
      { provide: AdminSessionService, useValue: session },
      { provide: DestroyRef, useValue: { onDestroy: (fn: () => void) => { destroyed.push(fn); return () => undefined; } } },
    ] });
    return { flow: runInInjectionContext(injector, () => new AdminPolicyBootstrap()), session, calls, history, invalidated, location, listeners, events,
      destroy: () => injector.destroy() };
  };
  try {
    for (const hash of ["#policy-bootstrap=9000." + nonce, "#policy-bootstrap=8971.bad", "#policy-bootstrap=https://evil/" + nonce]) {
      const f = create(hash); assert.equal(f.flow.active(), false); assert.deepEqual(f.history, ["/admin"]);
    }
    assert.equal(create(undefined, "DEV").flow.active(), false);
    assert.equal(create(undefined, "PROD", "https://evil.example").flow.active(), false);
    const later = create("");
    later.location.hash = "#policy-bootstrap=8971." + nonce;
    later.listeners.get("hashchange")!();
    assert.equal(later.flow.active(), true); assert.equal(later.location.hash, "");
    later.flow.cancel();
    later.location.hash = "#policy-bootstrap=8971." + nonce;
    later.events.next(new NavigationEnd(1, "/admin", "/admin"));
    assert.equal(later.flow.active(), false); assert.equal(later.location.hash, "");
    later.location.hash = "#policy-bootstrap=8971." + "c".repeat(64);
    later.events.next(new NavigationEnd(2, "/admin", "/admin"));
    assert.equal(later.flow.active(), true);
    later.destroy(); assert.equal(later.listeners.size, 0); assert.equal(later.flow.active(), false);
    const requests: { url: string; init?: RequestInit }[] = [];
    globalThis.fetch = async (url, init) => {
      requests.push({ url: String(url), init });
      return Response.json(String(url).endsWith("/challenge") ? challenge : receipt);
    };
    const f = create();
    assert.deepEqual(f.history, ["/admin"]); assert.equal(requests.length, 0);
    await f.flow.register(true); assert.equal(requests.length, 0);
    await f.flow.connect();
    assert.equal(f.flow.state(), "confirmed"); assert.deepEqual(f.calls, []);
    assert.deepEqual(JSON.parse(String(requests[0].init?.body)), { nonce });
    await f.flow.register(false); assert.deepEqual(f.calls, []);
    await f.flow.register(true);
    assert.deepEqual(f.calls, ["reauth", "token"]);
    assert.equal(f.flow.state(), "done"); assert.equal(f.flow.receipt()?.operationId, receipt.operationId);
    assert.equal(requests[1].url, "http://127.0.0.1:8971/bootstrap");
    assert.equal(requests[1].init?.credentials, "omit"); assert.equal(requests[1].init?.redirect, "error");
    assert.equal(requests[1].init?.referrerPolicy, "no-referrer");
    await f.flow.register(true); assert.equal(requests.length, 2);
    f.invalidated.next(); assert.equal(f.flow.active(), false); assert.equal(f.flow.receipt(), null);

    globalThis.fetch = async () => Response.json({ ...challenge, environment: "DEV" });
    const bad = create(); await bad.flow.connect(); await bad.flow.register(true);
    assert.equal(bad.flow.state(), "error"); assert.deepEqual(bad.calls, []);

    globalThis.fetch = async (url) => Response.json(String(url).endsWith("/challenge") ? challenge : { ...receipt, grantsWritten: 1 });
    const uncertain = create(); await uncertain.flow.connect(); await uncertain.flow.register(true);
    assert.equal(uncertain.flow.state(), "error"); assert.equal(uncertain.flow.receipt(), null);
    assert.match(uncertain.flow.message(), /Confira o recibo/);
    await uncertain.flow.register(true); assert.deepEqual(uncertain.calls, ["reauth", "token"]);

    globalThis.fetch = async () => Response.json(challenge);
    const cancelled = create(); await cancelled.flow.connect();
    cancelled.session.reauthenticate = async () => { cancelled.invalidated.next(); return false; };
    await cancelled.flow.register(true); assert.equal(cancelled.flow.active(), false); assert.deepEqual(cancelled.calls, []);

    const expired = create(); await expired.flow.connect();
    Date.now = () => originalNow() + 121_000;
    await expired.flow.register(true);
    assert.equal(expired.flow.state(), "error"); assert.deepEqual(expired.calls, []);
    Date.now = originalNow;

    const failed = create(); await failed.flow.connect();
    let writes = 0;
    globalThis.fetch = async () => { writes++; throw new Error("Synthetic network failure"); };
    await failed.flow.register(true); await failed.flow.register(true);
    assert.equal(writes, 1); assert.equal(failed.flow.receipt(), null);
    assert.match(failed.flow.message(), /Confira o recibo/);

    globalThis.fetch = async () => Response.json(challenge);
    const rapid = create(); await rapid.flow.connect();
    let finishAuthentication: ((ready: boolean) => void) | undefined;
    rapid.session.reauthenticate = () => new Promise<boolean>((resolve) => { finishAuthentication = resolve; });
    const pending = rapid.flow.register(true);
    await rapid.flow.register(true);
    assert.deepEqual(rapid.calls, []);
    finishAuthentication!(false); await pending;
    assert.equal(rapid.flow.state(), "error");
  } finally { globalThis.fetch = originalFetch; Date.now = originalNow; }
}
