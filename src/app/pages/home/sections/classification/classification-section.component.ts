import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SITE_COPY } from '../../../../core/constants/site-copy';

@Component({
  selector: 'app-classification-section',
  templateUrl: './classification-section.component.html',
  styleUrl: './classification-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassificationSectionComponent {
  protected readonly copy = SITE_COPY;

  readonly heading = input(true);
}
