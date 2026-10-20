import { Injectable, inject, signal } from "@angular/core";
import { ADMIN_CONFIG } from "./admin.config";
import type { Auth } from "firebase/auth";

@Injectable()
export class AdminAuth {
  private readonly config = inject(ADMIN_CONFIG);
  private auth: Auth | null = null;
  private sdk: typeof import("./firebase-auth.runtime") | null = null;
  private preparing: Promise<void> | null = null;
  readonly configured = !!this.config.firebase;
  readonly state = signal<"unconfigured" | "loading" | "ready" | "error">(
    this.configured ? "loading" : "unconfigured",
  );

  /** Load before enabling the button so opening Google stays inside the user's click. */
  prepare(): Promise<void> {
    if (!this.config.firebase || this.state() === "ready")
      return Promise.resolve();
    if (this.preparing) return this.preparing;
    this.state.set("loading");
    this.preparing = import("./firebase-auth.runtime")
      .then((sdk) => {
        const app =
          sdk.getApps().find((app) => app.name === "calcmot-admin") ??
          sdk.initializeApp(this.config.firebase!, "calcmot-admin");
        this.auth = sdk.initializeAuth(app, {
          persistence: sdk.inMemoryPersistence,
          popupRedirectResolver: sdk.browserPopupRedirectResolver,
        });
        this.sdk = sdk;
        this.state.set("ready");
      })
      .catch(() => {
        this.state.set("error");
      })
      .finally(() => {
        this.preparing = null;
      });
    return this.preparing;
  }

  login(reauthenticate = false): Promise<void> {
    if (!this.auth || !this.sdk)
      return Promise.reject(
        Object.assign(new Error("Authentication SDK is not ready"), {
          code: "auth/not-ready",
        }),
      );
    const provider = new this.sdk.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    // No await/import before popup: retain the click's transient user activation.
    const operation =
      reauthenticate && this.auth.currentUser
        ? this.sdk.reauthenticateWithPopup(this.auth.currentUser, provider)
        : this.sdk.signInWithPopup(this.auth, provider);
    return operation.then(() => undefined);
  }
  async token(): Promise<string> {
    if (!this.auth?.currentUser)
      throw Object.assign(new Error("No authenticated user"), {
        code: "auth/no-current-user",
      });
    return this.auth.currentUser.getIdToken();
  }
  async logout(): Promise<void> {
    if (this.auth && this.sdk) await this.sdk.signOut(this.auth);
  }
}
