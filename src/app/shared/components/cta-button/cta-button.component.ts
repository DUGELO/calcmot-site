import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-cta-button',
  templateUrl: './cta-button.component.html',
  styleUrl: './cta-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CtaButtonComponent {
  readonly label = input.required<string>();
  readonly href = input.required<string>();
  readonly variant = input<'primary' | 'secondary'>('primary');
  readonly size = input<'default' | 'compact'>('default');
  readonly external = input(false);
  readonly ariaLabel = input('');
}
