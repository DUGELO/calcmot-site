import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { PageSection } from '../../../core/constants/pages/page-copy.types';
import { OfferAlertComponent } from '../offer-alert/offer-alert.component';

@Component({
  selector: 'app-page-section',
  imports: [NgOptimizedImage, OfferAlertComponent],
  templateUrl: './page-section.component.html',
  styleUrl: './page-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageSectionComponent {
  readonly section = input.required<PageSection>();

  protected readonly hasMedia = computed(() => Boolean(this.section().image));
}
