import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import type { DecisionInput } from "../data-access/admin.models";
@Component({
  selector: "admin-review-form",
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: "./review-form.component.html",
  styleUrl: "./review-form.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewFormComponent implements OnChanges {
  readonly mode = input<"review" | "reopen">("review");
  readonly busy = input(false);
  readonly revision = input.required<number>();
  readonly evidenceIds = input<string[]>([]);
  readonly review = output<DecisionInput>();
  readonly form = new FormGroup({
    outcome: new FormControl<DecisionInput["outcome"]>("REQUEST_MORE", {
      nonNullable: true,
    }),
    reason: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(1000),
        Validators.pattern(/\S/),
      ],
    }),
    ownershipConfirmed: new FormControl(false, { nonNullable: true }),
    contradictionsCleared: new FormControl(false, { nonNullable: true }),
    legacyUseConcluded: new FormControl(false, { nonNullable: true }),
  });
  ngOnChanges(changes: SimpleChanges) {
    if (
      (changes["revision"] && !changes["revision"].firstChange) ||
      changes["mode"]
    )
      this.form.reset();
  }
  submit() {
    this.form.markAllAsTouched();
    if (this.form.valid && !this.busy())
      this.review.emit(
        this.mode() === "reopen"
          ? {
              outcome: "REQUEST_MORE",
              reason: this.form.controls.reason.value,
              evidenceIds: [],
              ownershipConfirmed: false,
              contradictionsCleared: false,
              legacyUseConcluded: false,
            }
          : {
              ...this.form.getRawValue(),
              evidenceIds: [...this.evidenceIds()],
            },
      );
  }
}
