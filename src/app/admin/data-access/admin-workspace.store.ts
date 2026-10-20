import {
  DestroyRef,
  Injectable,
  computed,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  EmptyError,
  Subject,
  catchError,
  firstValueFrom,
  forkJoin,
  map,
  of,
  switchMap,
  takeUntil,
} from "rxjs";
import { AdminSessionService } from "../auth/admin-session.service";
import {
  ADMIN_BACKEND,
  AdminApiError,
  ClaimQuery,
  adminError,
} from "./admin-api.service";
import type {
  ClaimView,
  Counts,
  DecisionInput,
  EvidenceInput,
  EvidenceView,
  EventView,
  Inspection,
  PendingOperation,
} from "./admin.models";

interface ListRequest {
  query: ClaimQuery;
  page: number;
}
/** State belongs to this admin route instance; no persistent cache or business rules. */
@Injectable()
export class AdminWorkspaceStore {
  private readonly api = inject(ADMIN_BACKEND);
  private readonly session = inject(AdminSessionService);
  private readonly destroyRef = inject(DestroyRef);
  readonly claims = signal<ClaimView[]>([]);
  readonly counts = signal<Counts["counts"] | null>(null);
  readonly query = signal<ClaimQuery>({});
  readonly page = signal(1);
  readonly nextCursor = signal<string | null>(null);
  readonly detail = signal<Inspection | null>(null);
  readonly evidence = signal<EvidenceView[]>([]);
  readonly events = signal<EventView[]>([]);
  readonly evidenceCursor = signal<string | null>(null);
  readonly eventsCursor = signal<string | null>(null);
  readonly pending = signal<PendingOperation | null>(null);
  readonly error = signal<AdminApiError | null>(null);
  readonly notice = signal("");
  readonly listLoading = signal(false);
  readonly detailLoading = signal(false);
  readonly mutating = signal(false);
  readonly busy = computed(
    () => this.listLoading() || this.detailLoading() || this.mutating(),
  );
  /** Display hint only; the server independently authorizes every issuance. */
  readonly showIssuance = computed(() => {
    const d = this.detail();
    return (
      !!d &&
      !d.grant &&
      d.view.state === "UNDER_REVIEW" &&
      d.latestDecision?.kind === "APPROVE" &&
      d.latestDecision.toRevision === d.view.revision
    );
  });
  private readonly listRequests = new Subject<ListRequest>();
  private readonly cancelCase = new Subject<void>();
  private cursors: (string | undefined)[] = [undefined];
  private caseEpoch = 0;
  private listKey = "";
  constructor() {
    this.listRequests
      .pipe(
        switchMap((request) =>
          forkJoin({
            counts: this.api.counts(),
            list: this.api.list(request.query),
          }).pipe(
            takeUntil(this.session.invalidated),
            map((result) => ({ request, result })),
            catchError((error) => of({ failure: adminError(error) })),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((outcome) => {
        this.listLoading.set(false);
        if ("failure" in outcome) {
          this.fail(outcome.failure);
          return;
        }
        const { request, result } = outcome;
        this.query.set({ ...request.query, cursor: undefined });
        this.page.set(request.page);
        this.cursors[request.page - 1] = request.query.cursor;
        this.claims.set(result.list.items);
        this.nextCursor.set(result.list.nextCursor);
        this.counts.set(result.counts.counts);
      });
    this.session.invalidated
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.clear());
    this.destroyRef.onDestroy(() => {
      this.cancelCase.next();
      this.cancelCase.complete();
      this.listRequests.complete();
    });
  }
  private fail(error: unknown) {
    const failure = adminError(error);
    if (failure.code === "REAUTH_REQUIRED") {
      this.session.requireReauthentication();
      this.error.set(failure);
    } else if (["AUTH_REQUIRED", "FORBIDDEN"].includes(failure.code))
      this.session.invalidate(failure);
    else this.error.set(failure);
  }
  dismissError() {
    this.error.set(null);
  }
  private clear() {
    this.closeCase();
    this.claims.set([]);
    this.counts.set(null);
    this.query.set({});
    this.page.set(1);
    this.nextCursor.set(null);
    this.cursors = [undefined];
    this.listLoading.set(false);
    this.error.set(null);
    this.notice.set("");
  }
  load(query: ClaimQuery = this.query(), page = 1) {
    if (!this.session.ready() || this.mutating()) return;
    const key = JSON.stringify({ query, page });
    if (this.listLoading() && key === this.listKey) return;
    this.listKey = key;
    this.error.set(null);
    this.notice.set("");
    this.listLoading.set(true);
    this.listRequests.next({ query: { ...query }, page });
  }
  search(query: ClaimQuery) {
    this.cursors = [undefined];
    this.load({ ...query, cursor: undefined });
  }
  paginate(forward: boolean) {
    if (this.listLoading()) return;
    const target = this.page() + (forward ? 1 : -1);
    const cursor = forward ? this.nextCursor() : this.cursors[target - 1];
    if (target < 1 || (forward && !cursor)) return;
    this.load({ ...this.query(), cursor: cursor ?? undefined }, target);
  }
  closeCase() {
    this.caseEpoch++;
    this.cancelCase.next();
    this.detail.set(null);
    this.evidence.set([]);
    this.events.set([]);
    this.evidenceCursor.set(null);
    this.eventsCursor.set(null);
    this.pending.set(null);
    this.detailLoading.set(false);
  }
  private readCase(id: string) {
    return forkJoin({
      detail: this.api.detail(id),
      evidence: this.api.evidence(id),
      events: this.api.events(id),
    }).pipe(takeUntil(this.cancelCase));
  }
  async open(id: string) {
    if (!this.session.ready()) return;
    this.closeCase();
    const epoch = this.caseEpoch;
    this.error.set(null);
    this.notice.set("");
    this.detailLoading.set(true);
    try {
      const result = await firstValueFrom(this.readCase(id));
      if (epoch !== this.caseEpoch) return;
      this.detail.set(result.detail);
      this.evidence.set(result.evidence.items);
      this.events.set(result.events.items);
      this.evidenceCursor.set(result.evidence.nextCursor);
      this.eventsCursor.set(result.events.nextCursor);
    } catch (error) {
      if (!(error instanceof EmptyError) && epoch === this.caseEpoch)
        this.fail(error);
    } finally {
      if (epoch === this.caseEpoch) this.detailLoading.set(false);
    }
  }
  prepareDecision(body: DecisionInput) {
    const d = this.detail();
    if (!d || this.busy()) return;
    this.error.set(null);
    this.pending.set({
      kind: "decision",
      claimId: d.view.claimId,
      intent: {
        body: structuredClone(body),
        revision: d.view.revision,
        key: crypto.randomUUID(),
      },
    });
  }
  prepareEvidence(body: EvidenceInput) {
    const d = this.detail();
    if (!d || this.busy()) return;
    this.error.set(null);
    this.pending.set({
      kind: "evidence",
      claimId: d.view.claimId,
      intent: {
        body: structuredClone(body),
        revision: d.view.revision,
        key: crypto.randomUUID(),
      },
    });
  }
  prepareIssuance() {
    const d = this.detail();
    if (!d || this.busy() || !this.showIssuance()) return;
    this.error.set(null);
    this.pending.set({
      kind: "issuance",
      claimId: d.view.claimId,
      intent: {
        body: {
          approvalEventId: d.latestDecision!.eventId,
          confirmation: { claimId: d.view.claimId, permanentCoreOnly: true },
        },
        revision: d.view.revision,
        key: crypto.randomUUID(),
      },
    });
  }
  cancel() {
    if (!this.mutating()) this.pending.set(null);
  }
  async execute() {
    const operation = this.pending();
    if (
      !operation ||
      this.mutating() ||
      !this.session.ready() ||
      this.session.reauthenticationRequired() ||
      (this.error() && !this.error()!.retryable)
    )
      return;
    const epoch = this.caseEpoch;
    this.mutating.set(true);
    this.error.set(null);
    this.notice.set("");
    try {
      if (operation.kind === "decision") {
        const result = await firstValueFrom(
          this.api.decide(operation.claimId, operation.intent),
        );
        if (epoch !== this.caseEpoch) return;
        this.detail.set({
          view: result.view,
          latestDecision: result.decision,
          grant: this.detail()?.grant ?? null,
        });
        this.notice.set(
          result.decision.kind === "APPROVE"
            ? "Aprovação registrada. O direito ainda não foi emitido."
            : "Avaliação registrada pelo serviço.",
        );
      } else if (operation.kind === "evidence") {
        const result = await firstValueFrom(
          this.api.addEvidence(operation.claimId, operation.intent),
        );
        if (epoch !== this.caseEpoch) return;
        this.detail.update((d) => (d ? { ...d, view: result.view } : null));
        this.notice.set("Referência de evidência registrada pelo serviço.");
      } else {
        const result = await firstValueFrom(
          this.api.issue(operation.claimId, operation.intent),
        );
        if (epoch !== this.caseEpoch) return;
        this.detail.update((d) =>
          d ? { ...d, view: result.view, grant: result.grant } : null,
        );
        this.notice.set("Emissão confirmada pelo serviço.");
      }
      this.pending.set(null);
      const result = await firstValueFrom(this.readCase(operation.claimId));
      if (epoch !== this.caseEpoch) return;
      this.detail.set(result.detail);
      this.evidence.set(result.evidence.items);
      this.events.set(result.events.items);
      this.evidenceCursor.set(result.evidence.nextCursor);
      this.eventsCursor.set(result.events.nextCursor);
    } catch (error) {
      if (!(error instanceof EmptyError) && epoch === this.caseEpoch)
        this.fail(error);
    } finally {
      this.mutating.set(false);
    }
  }
  async more(collection: "evidence" | "events") {
    const d = this.detail();
    const cursor =
      collection === "evidence" ? this.evidenceCursor() : this.eventsCursor();
    if (!d || !cursor || this.busy()) return;
    const epoch = this.caseEpoch;
    this.detailLoading.set(true);
    this.error.set(null);
    try {
      if (collection === "evidence") {
        const page = await firstValueFrom(
          this.api.evidence(d.view.claimId, cursor),
        );
        if (epoch !== this.caseEpoch) return;
        this.evidence.update((items) => [...items, ...page.items]);
        this.evidenceCursor.set(page.nextCursor);
      } else {
        const page = await firstValueFrom(
          this.api.events(d.view.claimId, cursor),
        );
        if (epoch !== this.caseEpoch) return;
        this.events.update((items) => [...items, ...page.items]);
        this.eventsCursor.set(page.nextCursor);
      }
    } catch (error) {
      if (epoch === this.caseEpoch) this.fail(error);
    } finally {
      if (epoch === this.caseEpoch) this.detailLoading.set(false);
    }
  }
}
