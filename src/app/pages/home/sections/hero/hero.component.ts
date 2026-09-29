import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BRAND_TOKENS } from '../../../../core/constants/brand.tokens';
import { SITE_COPY } from '../../../../core/constants/site-copy';
import { CtaButtonComponent } from '../../../../shared/components/cta-button/cta-button.component';

@Component({
  selector: 'app-hero',
  imports: [CtaButtonComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {
  protected readonly copy = SITE_COPY;
  protected readonly playStoreUrl = BRAND_TOKENS.links.playStore;
}
