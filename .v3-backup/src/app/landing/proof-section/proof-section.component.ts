import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SITE_COPY } from '../../core/constants/site-copy';

@Component({
  selector: 'app-proof-section',
  standalone: true,
  templateUrl: './proof-section.component.html',
  styleUrl: './proof-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProofSectionComponent {
  readonly copy = SITE_COPY.proof;
}
