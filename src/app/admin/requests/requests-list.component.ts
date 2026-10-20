import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  OnInit,
} from "@angular/core";
import { DatePipe } from "@angular/common";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import type { ClaimView } from "../data-access/admin.models";
import type { ClaimQuery } from "../data-access/admin-api.service";
import { RequestStatusComponent } from "./request-status.component";
@Component({
  selector: "admin-requests-list",
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RequestStatusComponent],
  templateUrl: "./requests-list.component.html",
  styleUrl: "./requests-list.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestsListComponent implements OnInit {
  readonly initialQuery = input<ClaimQuery>({});
  ngOnInit() {
    this.filters.patchValue({
      protocol: this.initialQuery().protocol ?? "",
      state: this.initialQuery().state ?? "",
    });
  }

  readonly items = input<ClaimView[]>([]);
  readonly busy = input(false);
  readonly page = input(1);
  readonly nextCursor = input<string | null>(null);
  readonly search = output<ClaimQuery>();
  readonly paginate = output<boolean>();
  readonly open = output<string>();
  readonly filters = new FormGroup({
    protocol: new FormControl("", {
      nonNullable: true,
      validators: [
        Validators.maxLength(128),
        Validators.pattern("[A-Za-z0-9_.:/-]*"),
      ],
    }),
    state: new FormControl("", { nonNullable: true }),
  });
  applyFilters() {
    this.filters.markAllAsTouched();
    if (this.filters.valid) this.search.emit(this.filters.getRawValue());
  }
}
