import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AdminWorkspaceStore } from "../data-access/admin-workspace.store";
import { DashboardSummaryComponent } from "../dashboard/dashboard-summary.component";
import { RequestsListComponent } from "./requests-list.component";
@Component({
  selector: "admin-requests-page",
  standalone: true,
  imports: [DashboardSummaryComponent, RequestsListComponent],
  templateUrl: "./requests-page.component.html",
  styleUrl: "./requests-page.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestsPageComponent implements OnInit {
  readonly store = inject(AdminWorkspaceStore);
  private readonly router = inject(Router);
  readonly overview = inject(ActivatedRoute).snapshot.data["overview"] === true;
  ngOnInit() {
    this.store.load();
  }
  open(id: string) {
    this.router.navigate(["/admin/solicitacoes", id]);
  }
}
