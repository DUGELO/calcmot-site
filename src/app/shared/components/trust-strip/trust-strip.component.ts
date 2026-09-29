import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-trust-strip',
  templateUrl: './trust-strip.component.html',
  styleUrl: './trust-strip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrustStripComponent {
  readonly items = input.required<readonly string[]>();
  readonly disclaimer = input('');
  readonly linkLabel = input('');
  readonly linkHref = input('');
}
