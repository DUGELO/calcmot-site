import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SITE_COPY } from '../../core/constants/site-copy';

@Component({
  selector: 'app-cockpit-section',
  standalone: true,
  templateUrl: './cockpit-section.component.html',
  styleUrl: './cockpit-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CockpitSectionComponent {
  readonly copy = SITE_COPY.cockpit;
}
