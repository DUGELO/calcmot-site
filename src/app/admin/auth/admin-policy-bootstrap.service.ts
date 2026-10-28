import { DOCUMENT } from "@angular/common";
import { DestroyRef, Injectable, computed, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs";
import { ADMIN_CONFIG } from "./admin.config";
import { AdminSessionService } from "./admin-session.service";

const receiver = "http://127.0.0.1:8971";
const policyVersion = "legacy-through-3.5-vc12";
export interface PolicyReceipt {
  operationId: string;
  policyVersion: string;
  policyRecordedAt: string;
}

/** Explicit private policy handoff; never handles case decisions or grants. */
@Injectable()
export class AdminPolicyBootstrap {
  private readonly document = inject(DOCUMENT);
  private readonly config = inject(ADMIN_CONFIG);
  private readonly session = inject(AdminSessionService);
  private readonly router = inject(Router);
  private nonce: string | null = null;
  private lastFragment = "";
  private challengeExpires = 0;
  private attempt = 0;
  private controller: AbortController | null = null;
  readonly active = signal(false);
  readonly state = signal<"idle" | "connecting" | "confirmed" | "sending" | "done" | "error">("idle");
  readonly busy = computed(() => ["connecting", "sending"].includes(this.state()));
  readonly message = signal("");
  readonly receipt = signal<PolicyReceipt | null>(null);

  constructor() {
    const view = this.document.defaultView;
    this.captureFragment();
    const capture = () => this.captureFragment();
    view?.addEventListener("hashchange", capture);
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd), takeUntilDestroyed(),
    ).subscribe(capture);
    this.session.invalidated.pipe(takeUntilDestroyed()).subscribe(() => this.cancel());
    inject(DestroyRef).onDestroy(() => {
      view?.removeEventListener("hashchange", capture);
      this.cancel();
    });
  }

  private captureFragment(): void {
    const view = this.document.defaultView;
    const fragment = view?.location.hash ?? "";
    if (fragment.startsWith("#policy-bootstrap=")) {
      // Consume before SDK preparation, rendering or any network request.
      view!.history.replaceState(view!.history.state, "", view!.location.pathname + view!.location.search);
      const match = /^#policy-bootstrap=8971\.([a-f0-9]{64})$/.exec(fragment);
      if (match && fragment !== this.lastFragment && !this.busy() && this.config.environment === "PROD" &&
          view!.location.origin === "https://calcmot.com.br" &&
          /^\/admin\/?$/.test(view!.location.pathname)) {
        this.lastFragment = fragment;
        this.nonce = match[1];
        this.challengeExpires = 0;
        this.receipt.set(null);
        this.message.set("");
        this.state.set("idle");
        this.active.set(true);
      }
    }
  }

  async connect(): Promise<void> {
    if (!this.nonce || this.state() !== "idle" || !this.authorized()) return;
    this.state.set("connecting");
    const attempt = ++this.attempt;
    try {
      const challenge = await this.post("/challenge", { nonce: this.nonce });
      if (attempt !== this.attempt) return;
      if (challenge["protocolVersion"] !== 1 || challenge["policyVersion"] !== policyVersion || challenge["environment"] !== "PROD" ||
          challenge["grantsWritten"] !== 0) throw new Error("Invalid challenge");
      this.challengeExpires = Date.now() + 120_000;
      this.state.set("confirmed");
    } catch {
      if (attempt === this.attempt) this.fail(false);
    }
  }

  async register(consented: boolean): Promise<void> {
    if (!consented || this.state() !== "confirmed" || !this.nonce || !this.authorized()) return;
    if (Date.now() >= this.challengeExpires) { this.fail(false); return; }
    const attempt = ++this.attempt;
    this.state.set("sending");
    let sent = false;
    let token = "";
    try {
      // This call starts the Google popup synchronously inside the explicit click.
      if (!(await this.session.reauthenticate()) || attempt !== this.attempt || !this.authorized()) return;
      if (Date.now() >= this.challengeExpires) throw new Error("Expired challenge");
      token = await this.session.auth.token();
      if (attempt !== this.attempt || !this.nonce || !this.authorized()) return;
      const nonce = this.nonce;
      this.nonce = null; // One intent per link; never retry an uncertain write.
      sent = true;
      const result = await this.post("/bootstrap", { nonce, token });
      token = "";
      if (attempt !== this.attempt) return;
      if (result["policyOnly"] !== true || result["environment"] !== "PROD" ||
          result["grantsWritten"] !== 0 || result["policyVersion"] !== policyVersion ||
          typeof result["operationId"] !== "string" || !/^policy-[a-f0-9]{24}$/.test(result["operationId"]) ||
          typeof result["policyRecordedAt"] !== "string" || !Number.isFinite(Date.parse(result["policyRecordedAt"])))
        throw new Error("Unconfirmed receipt");
      this.receipt.set({ operationId: result["operationId"], policyVersion,
        policyRecordedAt: result["policyRecordedAt"] });
      this.state.set("done");
    } catch {
      if (attempt === this.attempt) this.fail(sent);
    } finally {
      token = "";
      if (attempt === this.attempt && this.state() === "sending") this.fail(sent);
    }
  }

  cancel(): void {
    this.attempt++;
    this.controller?.abort();
    this.nonce = null;
    this.challengeExpires = 0;
    this.active.set(false);
    this.receipt.set(null);
  }
  private authorized(): boolean {
    return this.config.environment === "PROD" && this.session.ready() && this.session.environment() === "PROD";
  }
  private fail(sent: boolean): void {
    this.nonce = null;
    this.state.set("error");
    this.message.set(sent
      ? "Não foi possível confirmar o registro. Confira o recibo na ferramenta privada antes de iniciar outra tentativa. Nenhuma emissão foi solicitada."
      : "A conexão privada expirou ou não pôde ser validada. Abra um novo link na ferramenta privada para tentar novamente.");
  }
  private async post(path: "/challenge" | "/bootstrap", body: Record<string, string>): Promise<Record<string, unknown>> {
    this.controller = new AbortController();
    const controller = this.controller;
    const timer = setTimeout(() => controller.abort(), path === "/challenge" ? 10_000 : 90_000);
    try {
      const response = await fetch(receiver + path, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body), credentials: "omit", cache: "no-store",
        redirect: "error", referrerPolicy: "no-referrer", signal: controller.signal,
      });
      if (!response.ok) throw new Error("Private operation failed");
      const value: unknown = await response.json();
      if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid response");
      return value as Record<string, unknown>;
    } finally {
      clearTimeout(timer);
      if (this.controller === controller) this.controller = null;
    }
  }
}
