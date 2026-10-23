import {
  DestroyRef,
  Injectable,
  computed,
  inject,
  signal,
} from "@angular/core";
import { ADMIN_CONFIG, AdminEnvironment } from "./admin.config";
import { isCompatibleSession, sessionWritesEnabled } from "./admin-environment";
import { Subject, firstValueFrom } from "rxjs";
import { AdminAuth } from "./admin-auth.service";
import {
  ADMIN_BACKEND,
  AdminApiError,
  adminError,
} from "../data-access/admin-api.service";

@Injectable()
export class AdminSessionService {
  private readonly config = inject(ADMIN_CONFIG);
  readonly targetEnvironment = this.config.environment;
  readonly auth = inject(AdminAuth);
  private readonly api = inject(ADMIN_BACKEND);
  private timer: ReturnType<typeof setTimeout> | undefined;
  private attempt = 0;
  readonly environment = signal<AdminEnvironment | null>(null);
  private readonly serverWritesEnabled = signal(false);
  readonly mutationsEnabled = computed(
    () => this.ready() && this.serverWritesEnabled(),
  );
  readonly ready = signal(false);
  readonly reauthenticationRequired = signal(true);
  readonly busy = signal(false);
  readonly error = signal<AdminApiError | null>(null);
  private readonly invalidation = new Subject<void>();
  readonly invalidated = this.invalidation.asObservable();
  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
      this.invalidation.complete();
    });
  }

  async login(): Promise<void> {
    await this.authenticate();
  }
  reauthenticate(): Promise<boolean> {
    return this.authenticate();
  }
  private async authenticate(): Promise<boolean> {
    if (this.busy()) return false;
    const wasReady = this.ready();
    const attempt = ++this.attempt;
    this.busy.set(true);
    this.error.set(null);
    try {
      // A denied/expired session must allow choosing another Google account.
      // Reauthentication applies only to an already authorized active session.
      await this.auth.login(wasReady);
      const session = await firstValueFrom(this.api.session());
      if (attempt !== this.attempt) return false;
      if (!isCompatibleSession(session, this.config.environment))
        throw new AdminApiError(
          "CONTRACT_MISMATCH",
          "O painel e o serviço precisam ser atualizados juntos. Contate o responsável.",
        );
      const remaining =
        Date.parse(session.reauthenticateBy) - Date.parse(session.serverNow);
      if (!Number.isFinite(remaining))
        throw new AdminApiError(
          "INVALID_RESPONSE",
          "Não foi possível verificar a sessão. Tente entrar novamente.",
        );
      clearTimeout(this.timer);
      this.reauthenticationRequired.set(
        session.reauthenticationRequired || remaining <= 0,
      );
      if (!this.reauthenticationRequired())
        this.timer = setTimeout(
          () => this.requireReauthentication(),
          remaining,
        );
      this.environment.set(session.environment);
      this.serverWritesEnabled.set(sessionWritesEnabled(session, this.config));
      this.ready.set(true);
      return true;
    } catch (error) {
      if (attempt !== this.attempt) return false;
      const failure = adminError(error);
      if (
        wasReady &&
        ![
          "AUTH_REQUIRED",
          "FORBIDDEN",
          "CONTRACT_MISMATCH",
          "ENVIRONMENT_MISMATCH",
        ].includes(failure.code)
      )
        this.error.set(failure);
      else this.invalidate(failure);
      return false;
    } finally {
      this.busy.set(false);
    }
  }
  requireReauthentication() {
    clearTimeout(this.timer);
    this.reauthenticationRequired.set(true);
  }
  disableMutations() {
    this.serverWritesEnabled.set(false);
  }
  invalidate(error: AdminApiError | null = null) {
    this.attempt++;
    clearTimeout(this.timer);
    this.ready.set(false);
    this.serverWritesEnabled.set(false);
    this.environment.set(null);
    this.reauthenticationRequired.set(true);
    this.invalidation.next();
    this.error.set(error);
  }
  async logout() {
    this.invalidate();
    this.busy.set(true);
    try {
      await this.auth.logout();
    } catch {
      this.error.set(
        new AdminApiError(
          "SIGN_OUT_FAILED",
          "O painel foi fechado nesta aba. Recarregue a página antes de entrar novamente.",
        ),
      );
    } finally {
      this.busy.set(false);
    }
  }
}
