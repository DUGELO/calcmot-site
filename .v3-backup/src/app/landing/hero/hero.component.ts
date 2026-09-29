import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BRAND_TOKENS } from '../../core/constants/brand.tokens';
import { SITE_COPY } from '../../core/constants/site-copy';
import { CtaButtonComponent } from '../../shared/components/cta-button/cta-button.component';
import { PhoneMockupComponent } from '../../shared/components/phone-mockup/phone-mockup.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CtaButtonComponent, PhoneMockupComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {
  readonly copy = SITE_COPY.hero;
  readonly positioning = SITE_COPY.brand.positioning;
  readonly playStoreUrl = BRAND_TOKENS.links.playStore;
}
