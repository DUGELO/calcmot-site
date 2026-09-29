import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BRAND_TOKENS } from '../../../core/constants/brand.tokens';
import { SITE_COPY } from '../../../core/constants/site-copy';
import { CtaButtonComponent } from '../cta-button/cta-button.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CtaButtonComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  readonly copy = SITE_COPY;
  readonly playStoreUrl = BRAND_TOKENS.links.playStore;
}
