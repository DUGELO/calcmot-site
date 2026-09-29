import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BRAND_TOKENS } from '../../../core/constants/brand.tokens';
import { SITE_COPY } from '../../../core/constants/site-copy';

@Component({
  selector: 'app-site-footer',
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooterComponent {
  protected readonly copy = SITE_COPY;
  protected readonly playStoreUrl = BRAND_TOKENS.links.playStore;
  protected readonly instagramUrl = BRAND_TOKENS.links.instagram;
  protected readonly year = new Date().getFullYear();
}
