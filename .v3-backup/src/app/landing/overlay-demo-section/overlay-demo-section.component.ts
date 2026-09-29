import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SITE_COPY } from '../../core/constants/site-copy';
import { PhoneMockupComponent } from '../../shared/components/phone-mockup/phone-mockup.component';

@Component({
  selector: 'app-overlay-demo-section',
  standalone: true,
  imports: [PhoneMockupComponent],
  templateUrl: './overlay-demo-section.component.html',
  styleUrl: './overlay-demo-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlayDemoSectionComponent {
  readonly copy = SITE_COPY.overlay;
}
