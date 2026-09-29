import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BRAND_TOKENS } from '../../core/constants/brand.tokens';
import { SITE_COPY } from '../../core/constants/site-copy';
import { ClassificationBadgeComponent } from '../../shared/components/classification-badge/classification-badge.component';
import { CtaButtonComponent } from '../../shared/components/cta-button/cta-button.component';

@Component({
  selector: 'app-classification-section',
  standalone: true,
  imports: [ClassificationBadgeComponent, CtaButtonComponent],
  templateUrl: './classification-section.component.html',
  styleUrl: './classification-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassificationSectionComponent {
  readonly copy = SITE_COPY.classifications;
  readonly ctaLabel = SITE_COPY.hero.primaryCta;
  readonly playStoreUrl = BRAND_TOKENS.links.playStore;
}
