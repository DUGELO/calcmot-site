import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BRAND_TOKENS } from '../../../core/constants/brand.tokens';
import { SITE_COPY } from '../../../core/constants/site-copy';
import { CtaButtonComponent } from '../cta-button/cta-button.component';

@Component({
  selector: 'app-header',
  imports: [CtaButtonComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  protected readonly copy = SITE_COPY;
  protected readonly playStoreUrl = BRAND_TOKENS.links.playStore;
}
