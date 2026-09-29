import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SITE_COPY } from '../../../../core/constants/site-copy';

@Component({
  selector: 'app-how-it-works',
  templateUrl: './how-it-works.component.html',
  styleUrl: './how-it-works.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HowItWorksComponent {
  protected readonly copy = SITE_COPY;
}
