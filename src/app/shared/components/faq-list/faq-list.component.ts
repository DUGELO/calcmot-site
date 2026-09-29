import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { PageFaqItem } from '../../../core/constants/pages/page-copy.types';

@Component({
  selector: 'app-faq-list',
  templateUrl: './faq-list.component.html',
  styleUrl: './faq-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqListComponent {
  readonly items = input.required<readonly PageFaqItem[]>();
}
