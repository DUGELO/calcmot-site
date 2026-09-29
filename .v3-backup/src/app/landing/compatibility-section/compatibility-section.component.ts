import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SITE_COPY } from '../../core/constants/site-copy';

@Component({
  selector: 'app-compatibility-section',
  standalone: true,
  templateUrl: './compatibility-section.component.html',
  styleUrl: './compatibility-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompatibilitySectionComponent {
  readonly copy = SITE_COPY.compatibility;
}
