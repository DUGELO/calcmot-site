import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BRAND_TOKENS } from '../../core/constants/brand.tokens';
import { PRIVACIDADE_COPY } from '../../core/constants/pages/privacidade.copy';
import { SITE_COPY } from '../../core/constants/site-copy';
import { PageMetaService } from '../../core/services/page-meta.service';
import { webPageJsonLd, webSiteJsonLd } from '../../core/seo/structured-data';
import { CtaBandComponent } from '../../shared/components/cta-band/cta-band.component';
import { CtaButtonComponent } from '../../shared/components/cta-button/cta-button.component';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero.component';
import { PageSectionComponent } from '../../shared/components/page-section/page-section.component';
import { TrustStripComponent } from '../../shared/components/trust-strip/trust-strip.component';

@Component({
  selector: 'app-privacidade-page',
  imports: [
    PageHeroComponent,
    PageSectionComponent,
    TrustStripComponent,
    CtaButtonComponent,
    CtaBandComponent,
  ],
  templateUrl: './privacidade-page.component.html',
  styleUrl: './privacidade-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacidadePageComponent {
  protected readonly copy = SITE_COPY;
  protected readonly page = PRIVACIDADE_COPY;
  protected readonly playStoreUrl = BRAND_TOKENS.links.playStore;
  protected readonly supportEmail = BRAND_TOKENS.site.supportEmail;

  private readonly pageMeta = inject(PageMetaService);

  constructor() {
    this.pageMeta.apply({
      title: PRIVACIDADE_COPY.meta.title,
      description: PRIVACIDADE_COPY.meta.description,
      path: PRIVACIDADE_COPY.meta.path,
      structuredData: [
        webSiteJsonLd(),
        webPageJsonLd(
          PRIVACIDADE_COPY.meta.path,
          PRIVACIDADE_COPY.meta.title,
          PRIVACIDADE_COPY.meta.description,
        ),
      ],
    });
  }
}

