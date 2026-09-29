import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-product-proof',
  templateUrl: './product-proof.component.html',
  styleUrl: './product-proof.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductProofComponent {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input('');
  readonly note = input('');
  readonly image = input.required<string>();
  readonly alt = input.required<string>();
  protected readonly imageFailed = signal(false);
  protected onImageError(): void { this.imageFailed.set(true); }
}
