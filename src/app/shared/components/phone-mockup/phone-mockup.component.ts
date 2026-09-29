import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-phone-mockup',
  imports: [NgOptimizedImage],
  templateUrl: './phone-mockup.component.html',
  styleUrl: './phone-mockup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhoneMockupComponent {
  readonly src = input<string | null>(null);
  readonly alt = input('Demonstração visual de oferta e aviso CalcMot');
  readonly width = input(720);
  readonly height = input(1600);
  readonly priority = input(false);
  readonly badge = input('');
  protected readonly imageFailed = signal(false);
  protected onImageError(): void { this.imageFailed.set(true); }
}
