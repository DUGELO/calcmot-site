import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SITE_COPY } from '../../core/constants/site-copy';

@Component({
  selector: 'app-offer-comparison-section',
  standalone: true,
  templateUrl: './offer-comparison-section.component.html',
  styleUrl: './offer-comparison-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferComparisonSectionComponent {
  readonly copy = SITE_COPY.comparison;
}
