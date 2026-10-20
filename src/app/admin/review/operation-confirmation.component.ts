import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  inject,
  afterNextRender,
  OnChanges,
  SimpleChanges,
  input,
  output,
} from "@angular/core";
import { AdminConfirmationComponent } from "./admin-confirmation.component";
import { DECISION_LABELS, PendingOperation } from "../data-access/admin.models";
import type { AdminApiError } from "../data-access/admin-api.service";
@Component({
  selector: "admin-operation-confirmation",
  standalone: true,
  imports: [AdminConfirmationComponent],
  templateUrl: "./operation-confirmation.component.html",
  styleUrl: "./operation-confirmation.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationConfirmationComponent implements OnChanges {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  readonly operation = input.required<PendingOperation>();
  readonly busy = input(false);
  readonly error = input<AdminApiError | null>(null);
  readonly reauthRequired = input(false);
  readonly reauthenticate = output<void>();
  readonly accepted = output<void>();
  readonly cancelled = output<void>();
  readonly labels = DECISION_LABELS;
  confirmed = false;
  ngOnChanges(changes: SimpleChanges) {
    if (changes["reauthRequired"] || changes["operation"])
      this.confirmed = false;
    if (changes["reauthRequired"] && !changes["reauthRequired"].firstChange) {
      afterNextRender(
        () => {
          const selector = this.reauthRequired()
            ? "button.primary"
            : "input[type=checkbox]";
          this.element.nativeElement
            .querySelector<HTMLElement>(selector)
            ?.focus();
        },
        { injector: this.injector },
      );
    }
  }
  submit() {
    if (
      this.confirmed &&
      !this.busy() &&
      !this.reauthRequired() &&
      (!this.error() || this.error()!.retryable)
    )
      this.accepted.emit();
  }
}
