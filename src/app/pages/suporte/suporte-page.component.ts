import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BRAND_TOKENS } from '../../core/constants/brand.tokens';
import { SUPORTE_COPY } from '../../core/constants/pages/suporte.copy';
import { SITE_COPY } from '../../core/constants/site-copy';
import { PageMetaService } from '../../core/services/page-meta.service';
import { faqJsonLd, webPageJsonLd, webSiteJsonLd } from '../../core/seo/structured-data';
import { CtaBandComponent } from '../../shared/components/cta-band/cta-band.component';
import { CtaButtonComponent } from '../../shared/components/cta-button/cta-button.component';
import { FaqListComponent } from '../../shared/components/faq-list/faq-list.component';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero.component';
import { PageSectionComponent } from '../../shared/components/page-section/page-section.component';

@Component({
  selector: 'app-suporte-page',
  imports: [
    PageHeroComponent,
    PageSectionComponent,
    FaqListComponent,
    CtaButtonComponent,
    CtaBandComponent,
  ],
  templateUrl: './suporte-page.component.html',
  styleUrl: './suporte-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuportePageComponent {
  protected readonly copy = SITE_COPY;
  protected readonly page = SUPORTE_COPY;
  protected readonly playStoreUrl = BRAND_TOKENS.links.playStore;
  protected readonly supportEmail = BRAND_TOKENS.site.supportEmail;

  private readonly pageMeta = inject(PageMetaService);

  constructor() {
    this.pageMeta.apply({
      title: SUPORTE_COPY.meta.title,
      description: SUPORTE_COPY.meta.description,
      path: SUPORTE_COPY.meta.path,
      structuredData: [
        webSiteJsonLd(),
        webPageJsonLd(
          SUPORTE_COPY.meta.path,
          SUPORTE_COPY.meta.title,
          SUPORTE_COPY.meta.description,
        ),
        faqJsonLd(SUPORTE_COPY.faq?.items ?? []),
      ],
    });
  }
}
