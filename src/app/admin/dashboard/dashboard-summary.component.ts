import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import type { Counts } from "../data-access/admin.models";
@Component({
  selector: "admin-dashboard-summary",
  standalone: true,
  templateUrl: "./dashboard-summary.component.html",
  styleUrl: "./dashboard-summary.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSummaryComponent {
  readonly counts = input<Counts["counts"] | null>(null);
}
