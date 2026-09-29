import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SITE_COPY } from '../../core/constants/site-copy';

@Component({
  selector: 'app-faq-section',
  standalone: true,
  templateUrl: './faq-section.component.html',
  styleUrl: './faq-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqSectionComponent {
  readonly copy = SITE_COPY.faq;
}
