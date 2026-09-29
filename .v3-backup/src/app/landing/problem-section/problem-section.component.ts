import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SITE_COPY } from '../../core/constants/site-copy';
import { FeatureCardComponent } from '../../shared/components/feature-card/feature-card.component';

@Component({
  selector: 'app-problem-section',
  standalone: true,
  imports: [FeatureCardComponent],
  templateUrl: './problem-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProblemSectionComponent {
  readonly copy = SITE_COPY.problem;
}
