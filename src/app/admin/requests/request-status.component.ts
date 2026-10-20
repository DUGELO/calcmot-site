import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { STATE_LABELS, ClaimState } from "../data-access/admin.models";
@Component({
  selector: "admin-status",
  standalone: true,
  template: `<span class="status" [attr.data-state]="state()">{{
    labels[state()]
  }}</span>`,
  styleUrl: "./request-status.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestStatusComponent {
  readonly state = input.required<ClaimState>();
  readonly labels = STATE_LABELS;
}
