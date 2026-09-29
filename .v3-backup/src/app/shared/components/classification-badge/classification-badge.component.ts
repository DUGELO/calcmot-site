import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ClassificationTone = 'great' | 'good' | 'warning' | 'bad';

@Component({
  selector: 'app-classification-badge',
  standalone: true,
  templateUrl: './classification-badge.component.html',
  styleUrl: './classification-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassificationBadgeComponent {
  readonly label = input.required<string>();
  readonly detail = input.required<string>();
  readonly tone = input.required<ClassificationTone>();
}
