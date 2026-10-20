import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from "@angular/core";
@Component({
  selector: "admin-shell",
  standalone: true,
  templateUrl: "./admin-shell.component.html",
  styleUrl: "./admin-shell.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminShellComponent {
  readonly ready = input(false);
  readonly busy = input(false);
  readonly tab = input<"overview" | "claims">("overview");
  readonly navigate = output<"overview" | "claims">();
  readonly logout = output<void>();
}
