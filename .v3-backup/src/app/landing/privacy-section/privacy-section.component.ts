import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SITE_COPY } from '../../core/constants/site-copy';

@Component({
  selector: 'app-privacy-section',
  standalone: true,
  templateUrl: './privacy-section.component.html',
  styleUrl: './privacy-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacySectionComponent {
  readonly copy = SITE_COPY.privacy;
}
