import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BRAND_TOKENS } from '../../core/constants/brand.tokens';
import { SITE_COPY } from '../../core/constants/site-copy';
import { CtaButtonComponent } from '../../shared/components/cta-button/cta-button.component';

@Component({
  selector: 'app-final-cta-section',
  standalone: true,
  imports: [CtaButtonComponent],
  templateUrl: './final-cta-section.component.html',
  styleUrl: './final-cta-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinalCtaSectionComponent {
  readonly copy = SITE_COPY.finalCta;
  readonly playStoreUrl = BRAND_TOKENS.links.playStore;
}
