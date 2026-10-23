import { Injectable, InjectionToken, inject } from "@angular/core";
import {
  HttpClient,
  HttpErrorResponse,
  HttpResponse,
} from "@angular/common/http";
import {
  Observable,
  catchError,
  defer,
  filter,
  map,
  switchMap,
  throwError,
} from "rxjs";
import { AdminAuth } from "../auth/admin-auth.service";
import { ADMIN_CONFIG } from "../auth/admin.config";
import {
  adminWritesEnabled,
  isCompatibleSession,
} from "../auth/admin-environment";
import type {
  AdminSession,
  Counts,
  Inspection,
  ClaimView,
  DecisionInput,
  DecisionResult,
  EvidenceInput,
  EvidenceView,
  EventView,
  IssuanceInput,
  IssuanceResult,
  MutationIntent,
  Page,
} from "./admin.models";

export interface ClaimQuery {
  protocol?: string;
  state?: string;
  cursor?: string;
}
export interface AdminBackend {
  session(): Observable<AdminSession>;
  counts(): Observable<Counts>;
  list(query: ClaimQuery): Observable<Page<ClaimView>>;
  detail(id: string): Observable<Inspection>;
  evidence(id: string, cursor?: string): Observable<Page<EvidenceView>>;
  events(id: string, cursor?: string): Observable<Page<EventView>>;
  addEvidence(
    id: string,
    intent: MutationIntent<EvidenceInput>,
  ): Observable<{ view: ClaimView }>;
  decide(
    id: string,
    intent: MutationIntent<DecisionInput>,
  ): Observable<DecisionResult>;
  issue(
    id: string,
    intent: MutationIntent<IssuanceInput>,
  ): Observable<IssuanceResult>;
}
export class AdminApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly retryable = false,
    readonly requestId?: string,
  ) {
    super(message);
  }
}
const messages: Record<string, string> = {
  AUTH_REQUIRED: "Sua sessão terminou. Entre novamente para continuar.",
  REAUTH_REQUIRED:
    "Confirme sua identidade com o Google para continuar. Nenhuma ação será repetida automaticamente.",
  FORBIDDEN: "Esta conta não tem autorização para acessar o painel.",
  CONFLICT:
    "Este pedido foi atualizado. Recarregue os dados antes de tomar uma nova decisão.",
  GRANT_PRESERVED: "Já existe um direito emitido. Ele foi preservado.",
  NOT_FOUND: "Não encontramos este pedido.",
  RATE_LIMITED: "Muitas tentativas. Aguarde antes de tentar novamente.",
  RETRY_LATER:
    "O serviço está temporariamente indisponível. Tente novamente mais tarde.",
  MORE_EVIDENCE_REQUIRED:
    "São necessárias mais evidências para concluir esta avaliação.",
  LINK_REQUIRED:
    "O pedido precisa da referência de vínculo exigida para esta operação.",
  POLICY_REQUIRED:
    "A política necessária ainda não está disponível. Contate o responsável.",
  INVALID_REQUEST: "Revise os campos informados antes de continuar.",
};
export function adminError(error: unknown): AdminApiError {
  if (error instanceof AdminApiError) return error;
  if (error instanceof HttpErrorResponse) {
    const body = error.error as {
      code?: string;
      requestId?: string;
      retryable?: boolean;
    } | null;
    const code =
      typeof body?.code === "string"
        ? body.code
        : error.status === 0
          ? "NETWORK"
          : "INVALID_RESPONSE";
    return new AdminApiError(
      code,
      messages[code] ??
        (error.status === 0
          ? "Não foi possível confirmar a resposta. Verifique a conexão e tente novamente."
          : "O serviço retornou uma resposta inesperada. Recarregue o painel ou contate o responsável."),
      body?.retryable === true || error.status === 0,
      typeof body?.requestId === "string" ? body.requestId : undefined,
    );
  }
  const authCode =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";
  if (
    authCode === "auth/popup-closed-by-user" ||
    authCode === "auth/cancelled-popup-request"
  )
    return new AdminApiError(
      "CANCELLED",
      "Entrada cancelada. Nenhuma operação foi executada.",
    );
  if (authCode === "auth/popup-blocked")
    return new AdminApiError(
      "POPUP_BLOCKED",
      "Permita a janela de entrada do Google neste navegador e tente novamente.",
    );
  if (
    [
      "auth/no-current-user",
      "auth/user-token-expired",
      "auth/invalid-user-token",
      "auth/user-disabled",
    ].includes(authCode)
  )
    return new AdminApiError("AUTH_REQUIRED", messages["AUTH_REQUIRED"]);
  if (authCode === "auth/not-ready")
    return new AdminApiError(
      "AUTH_NOT_READY",
      "Aguarde a preparação da entrada com Google ou recarregue o painel.",
    );
  return new AdminApiError(
    "UNKNOWN",
    "Não foi possível continuar. Tente novamente ou contate o responsável.",
  );
}
function segment(id: string): string {
  if (!/^[A-Za-z0-9_.:/-]{1,128}$/.test(id) || id === "." || id === "..")
    throw new AdminApiError("INVALID_REQUEST", messages["INVALID_REQUEST"]);
  return encodeURIComponent(id);
}
@Injectable()
export class AdminApi implements AdminBackend {
  private readonly config = inject(ADMIN_CONFIG);
  private readonly auth = inject(AdminAuth);
  private readonly http = inject(HttpClient);
  private checkEnvironment(value: string | null) {
    if (
      !["DEV", "PROD"].includes(this.config.environment) ||
      value !== this.config.environment
    )
      throw new AdminApiError(
        "ENVIRONMENT_MISMATCH",
        "O serviço não corresponde ao ambiente deste painel. Nenhum resultado foi aplicado. Recarregue ou contate o responsável.",
      );
  }
  private request<T>(
    path: string,
    intent?: MutationIntent<unknown>,
  ): Observable<T> {
    return defer(() => {
      this.checkEnvironment(this.config.environment);
      if (intent && !adminWritesEnabled(this.config))
        throw new AdminApiError(
          "READ_ONLY",
          "Este painel está disponível somente para consulta.",
        );
      return this.send<T>(path, intent);
    }).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse && error.status > 0) {
          try {
            this.checkEnvironment(error.headers.get("X-CalcMot-Environment"));
          } catch (mismatch) {
            return throwError(() => mismatch);
          }
        }
        return throwError(() => adminError(error));
      }),
    );
  }
  private send<T>(
    path: string,
    intent?: MutationIntent<unknown>,
  ): Observable<T> {
    return defer(() => this.auth.token()).pipe(
      switchMap((token) =>
        this.http.request<T>(intent ? "POST" : "GET", `/api/admin/v1${path}`, {
          credentials: "omit",
          cache: "no-store",
          redirect: "error",
          transferCache: false,
          observe: "events",
          timeout: 20000,
          headers: {
            Authorization: `Bearer ${token}`,
            "X-CalcMot-Admin": "1",
            ...(intent
              ? {
                  "Content-Type": "application/json",
                  "If-Match": `"${intent.revision}"`,
                  "Idempotency-Key": intent.key,
                  "X-CalcMot-Expected-Environment": this.config.environment,
                }
              : {}),
          },
          ...(intent ? { body: intent.body } : {}),
        }),
      ),
      filter(
        (event): event is HttpResponse<T> => event instanceof HttpResponse,
      ),
      map((response) => {
        this.checkEnvironment(response.headers.get("X-CalcMot-Environment"));
        if (response.body === null)
          throw new AdminApiError(
            "INVALID_RESPONSE",
            "O serviço retornou uma resposta incompleta.",
          );
        return response.body;
      }),
    );
  }
  session() {
    return this.request<AdminSession>("/session").pipe(
      map((session) => {
        if (!isCompatibleSession(session, this.config.environment))
          throw new AdminApiError(
            "CONTRACT_MISMATCH",
            "O painel e o serviço precisam ser atualizados juntos. Contate o responsável.",
          );
        return session;
      }),
    );
  }
  counts() {
    return this.request<Counts>("/claims/counts");
  }
  list(filters: ClaimQuery) {
    const query = new URLSearchParams({ limit: "10" });
    for (const [key, value] of Object.entries(filters))
      if (value) query.set(key, value);
    return this.request<Page<ClaimView>>(`/claims?${query}`);
  }
  detail(id: string) {
    return this.request<Inspection>(`/claims/${segment(id)}`);
  }
  evidence(id: string, cursor?: string) {
    return this.request<Page<EvidenceView>>(
      `/claims/${segment(id)}/evidence?limit=20${cursor ? "&cursor=" + encodeURIComponent(cursor) : ""}`,
    );
  }
  events(id: string, cursor?: string) {
    return this.request<Page<EventView>>(
      `/claims/${segment(id)}/events?limit=20${cursor ? "&cursor=" + encodeURIComponent(cursor) : ""}`,
    );
  }
  addEvidence(id: string, intent: MutationIntent<EvidenceInput>) {
    return this.request<{ view: ClaimView }>(
      `/claims/${segment(id)}/evidence`,
      intent,
    );
  }
  decide(id: string, intent: MutationIntent<DecisionInput>) {
    return this.request<DecisionResult>(
      `/claims/${segment(id)}/decisions`,
      intent,
    );
  }
  issue(id: string, intent: MutationIntent<IssuanceInput>) {
    return this.request<IssuanceResult>(
      `/claims/${segment(id)}/issuance`,
      intent,
    );
  }
}
/** One substitutable boundary, used by isolated tests; production always resolves AdminApi. */
export const ADMIN_BACKEND = new InjectionToken<AdminBackend>("ADMIN_BACKEND");
