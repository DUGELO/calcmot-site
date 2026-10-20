import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
import { DatePipe } from "@angular/common";
import { EVENT_LABELS, EventView } from "../data-access/admin.models";
@Component({
  selector: "admin-case-audit",
  standalone: true,
  imports: [DatePipe],
  templateUrl: "./case-audit.component.html",
  styleUrl: "./case-audit.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaseAuditComponent {
  readonly events = input<EventView[]>([]);
  readonly busy = input(false);
  readonly moreAvailable = input(false);
  readonly more = output<void>();
  readonly labels = EVENT_LABELS;
}
