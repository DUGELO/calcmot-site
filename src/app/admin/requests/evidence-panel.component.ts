import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { DatePipe } from "@angular/common";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import type { EvidenceInput, EvidenceView } from "../data-access/admin.models";
@Component({
  selector: "admin-evidence-panel",
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: "./evidence-panel.component.html",
  styleUrl: "./evidence-panel.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvidencePanelComponent implements OnChanges {
  readonly revision = input.required<number>();
  readonly items = input<EvidenceView[]>([]);
  readonly busy = input(false);
  readonly editable = input(false);
  readonly moreAvailable = input(false);
  readonly selection = input<string[]>([]);
  readonly selected = output<string[]>();
  readonly register = output<EvidenceInput>();
  readonly more = output<void>();
  readonly form = new FormGroup({
    kind: new FormControl<EvidenceInput["kind"]>("AUXILIARY", {
      nonNullable: true,
    }),
    category: new FormControl<EvidenceInput["category"]>("SUPPORT_RECORD", {
      nonNullable: true,
    }),
    originKey: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(128),
        Validators.pattern("[A-Za-z0-9_.:/-]+"),
      ],
    }),
    reference: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(128),
        Validators.pattern("[A-Za-z0-9_.:/-]+"),
      ],
    }),
    authorityEvidenceId: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.maxLength(128),
        Validators.pattern("[A-Za-z0-9_.:/-]*"),
      ],
    }),
  });
  ngOnChanges(changes: SimpleChanges) {
    if (changes["revision"] && !changes["revision"].firstChange)
      this.form.reset();
  }
  select(id: string, checked: boolean) {
    if (checked && this.selection().length >= 16) return;
    this.selected.emit(
      checked
        ? [...this.selection(), id]
        : this.selection().filter((value) => value !== id),
    );
  }
  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    const value = this.form.getRawValue();
    if (value.kind === "HISTORY" && !value.authorityEvidenceId) {
      this.form.controls.authorityEvidenceId.setErrors({ required: true });
      return;
    }
    this.register.emit({
      kind: value.kind,
      category:
        value.kind === "DECLARATION" ? "USER_STATEMENT" : value.category,
      originKey: value.originKey,
      reference: value.reference,
      ...(value.kind === "HISTORY"
        ? { authorityEvidenceId: value.authorityEvidenceId }
        : {}),
    });
  }
}
