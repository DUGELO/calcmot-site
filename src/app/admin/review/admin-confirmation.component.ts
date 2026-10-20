import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  output,
} from "@angular/core";
import { DOCUMENT } from "@angular/common";
@Component({
  selector: "admin-confirmation",
  standalone: true,
  template: `<dialog
    class="confirmation panel"
    aria-labelledby="confirmation-title"
    (cancel)="$event.preventDefault(); cancel.emit()"
  >
    <ng-content />
  </dialog>`,
  styleUrl: "./admin-confirmation.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminConfirmationComponent {
  readonly cancel = output<void>();
  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef);
    const document = inject(DOCUMENT);
    let opener: HTMLElement | null = null;
    afterNextRender(() => {
      opener = document.activeElement as HTMLElement | null;
      element.nativeElement.querySelector("dialog")?.showModal();
    });
    inject(DestroyRef).onDestroy(() => {
      element.nativeElement.querySelector("dialog")?.close();
      queueMicrotask(() => {
        if (opener?.isConnected) opener.focus();
        else document.getElementById("case-title")?.focus();
      });
    });
  }
}
