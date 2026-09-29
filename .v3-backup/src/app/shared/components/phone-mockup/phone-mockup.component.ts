import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BRAND_TOKENS } from '../../../core/constants/brand.tokens';

@Component({
  selector: 'app-phone-mockup',
  standalone: true,
  templateUrl: './phone-mockup.component.html',
  styleUrl: './phone-mockup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhoneMockupComponent {
  readonly screenshotSrc = input(BRAND_TOKENS.assets.overlayScreenshot);
}
