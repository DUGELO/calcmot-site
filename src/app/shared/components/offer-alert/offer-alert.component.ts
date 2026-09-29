import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ClassificationTone } from '../../../core/constants/pages/page-copy.types';

@Component({
  selector: 'app-offer-alert',
  templateUrl: './offer-alert.component.html',
  styleUrl: './offer-alert.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferAlertComponent {
  readonly status = input.required<string>();
  readonly meaning = input.required<string>();
  readonly perKm = input.required<string>();
  readonly perHour = input.required<string>();
  readonly minutes = input.required<string>();
  readonly tone = input<ClassificationTone>('good');
  readonly exampleLabel = input('');
}
