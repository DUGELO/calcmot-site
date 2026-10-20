import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  DestroyRef,
  computed,
  inject,
} from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { Meta, Title } from "@angular/platform-browser";
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterOutlet,
} from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { filter, map } from "rxjs";
import { AdminShellComponent } from "./layout/admin-shell.component";
import { OperationConfirmationComponent } from "./review/operation-confirmation.component";
import { AdminSessionService } from "./auth/admin-session.service";
import { AdminWorkspaceStore } from "./data-access/admin-workspace.store";
@Component({
  selector: "app-admin",
  standalone: true,
  imports: [RouterOutlet, AdminShellComponent, OperationConfirmationComponent],
  templateUrl: "./admin.component.html",
  styleUrl: "./admin.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent {
  readonly session = inject(AdminSessionService);
  readonly store = inject(AdminWorkspaceStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  readonly tab = computed(() =>
    this.url().startsWith("/admin/solicitacoes")
      ? ("claims" as const)
      : ("overview" as const),
  );
  readonly error = computed(() => this.session.error() ?? this.store.error());
  constructor() {
    afterNextRender(() => {
      void this.session.auth.prepare();
    });
    this.document.body.classList.add("calcmot-admin");
    inject(DestroyRef).onDestroy(() => {
      this.session.invalidate();
      this.document.body.classList.remove("calcmot-admin");
    });
    inject(Meta).updateTag({ name: "robots", content: "noindex, nofollow" });
    inject(Title).setTitle("Administração | CalcMot");
    this.document.querySelector('link[rel="canonical"]')?.remove();
    this.document.getElementById("calcmot-structured-data")?.remove();
  }
  navigate(tab: "overview" | "claims") {
    if (!this.store.mutating())
      this.router.navigate([tab === "overview" ? "./" : "solicitacoes"], {
        relativeTo: this.route,
      });
  }
  async reauthenticate() {
    if (await this.session.reauthenticate()) this.store.dismissError();
  }
  reload() {
    this.document.defaultView?.location.reload();
  }
}
