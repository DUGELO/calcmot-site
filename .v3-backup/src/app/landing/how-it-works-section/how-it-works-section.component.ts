import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SITE_COPY } from '../../core/constants/site-copy';

@Component({
  selector: 'app-how-it-works-section',
  standalone: true,
  templateUrl: './how-it-works-section.component.html',
  styleUrl: './how-it-works-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HowItWorksSectionComponent {
  readonly copy = SITE_COPY.howItWorks;
}
