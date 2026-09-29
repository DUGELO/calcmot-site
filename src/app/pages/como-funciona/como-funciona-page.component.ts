import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BRAND_TOKENS } from '../../core/constants/brand.tokens';
import { COMO_FUNCIONA_COPY } from '../../core/constants/pages/como-funciona.copy';
import { SITE_COPY } from '../../core/constants/site-copy';
import { PageMetaService } from '../../core/services/page-meta.service';
import { webPageJsonLd, webSiteJsonLd } from '../../core/seo/structured-data';
import { CtaBandComponent } from '../../shared/components/cta-band/cta-band.component';
import { CtaButtonComponent } from '../../shared/components/cta-button/cta-button.component';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero.component';
import { PageSectionComponent } from '../../shared/components/page-section/page-section.component';

@Component({
  selector: 'app-como-funciona-page',
  imports: [PageHeroComponent, PageSectionComponent, CtaButtonComponent, CtaBandComponent],
  templateUrl: './como-funciona-page.component.html',
  styleUrl: './como-funciona-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComoFuncionaPageComponent {
  protected readonly copy = SITE_COPY;
  protected readonly page = COMO_FUNCIONA_COPY;
  protected readonly playStoreUrl = BRAND_TOKENS.links.playStore;

  private readonly pageMeta = inject(PageMetaService);

  constructor() {
    this.pageMeta.apply({
      title: COMO_FUNCIONA_COPY.meta.title,
      description: COMO_FUNCIONA_COPY.meta.description,
      path: COMO_FUNCIONA_COPY.meta.path,
      structuredData: [
        webSiteJsonLd(),
        webPageJsonLd(
          COMO_FUNCIONA_COPY.meta.path,
          COMO_FUNCIONA_COPY.meta.title,
          COMO_FUNCIONA_COPY.meta.description,
        ),
      ],
    });
  }
}
