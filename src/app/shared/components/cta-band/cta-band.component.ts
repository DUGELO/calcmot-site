import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BRAND_TOKENS } from '../../../core/constants/brand.tokens';
import { CtaButtonComponent } from '../cta-button/cta-button.component';

@Component({
  selector: 'app-cta-band',
  imports: [CtaButtonComponent],
  templateUrl: './cta-band.component.html',
  styleUrl: './cta-band.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CtaBandComponent {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly note = input('');
  readonly secondaryLabel = input('');
  readonly secondaryHref = input('');
  protected readonly playStoreUrl = BRAND_TOKENS.links.playStore;
  protected readonly playStoreLabel = 'Baixar na Play Store';
}
