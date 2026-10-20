import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from "@angular/core";
import { DatePipe, DOCUMENT } from "@angular/common";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AdminWorkspaceStore } from "../data-access/admin-workspace.store";
import { RequestStatusComponent } from "./request-status.component";
import { EvidencePanelComponent } from "./evidence-panel.component";
import { ReviewFormComponent } from "../review/review-form.component";
import { CaseAuditComponent } from "../audit/case-audit.component";
@Component({
  selector: "admin-request-details-page",
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    RequestStatusComponent,
    EvidencePanelComponent,
    ReviewFormComponent,
    CaseAuditComponent,
  ],
  templateUrl: "./request-details-page.component.html",
  styleUrl: "./request-details-page.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestDetailsPageComponent {
  readonly store = inject(AdminWorkspaceStore);
  readonly selection = signal<string[]>([]);
  constructor() {
    const document = inject(DOCUMENT);
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe(async (params) => {
        this.selection.set([]);
        await this.store.open(params.get("claimId") ?? "");
        setTimeout(() => document.getElementById("case-title")?.focus());
      });
    inject(DestroyRef).onDestroy(() => this.store.closeCase());
  }
}
