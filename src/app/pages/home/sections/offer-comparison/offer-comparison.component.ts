import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SITE_COPY } from '../../../../core/constants/site-copy';

@Component({
  selector: 'app-offer-comparison',
  templateUrl: './offer-comparison.component.html',
  styleUrl: './offer-comparison.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferComparisonComponent {
  protected readonly copy = SITE_COPY;
}
