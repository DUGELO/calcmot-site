import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BRAND_TOKENS } from '../../core/constants/brand.tokens';
import { CALCULADORA_COPY } from '../../core/constants/pages/calculadora.copy';
import { SITE_COPY } from '../../core/constants/site-copy';
import { PageMetaService } from '../../core/services/page-meta.service';
import { webPageJsonLd, webSiteJsonLd } from '../../core/seo/structured-data';
import { CtaBandComponent } from '../../shared/components/cta-band/cta-band.component';
import { CtaButtonComponent } from '../../shared/components/cta-button/cta-button.component';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero.component';
import { PageSectionComponent } from '../../shared/components/page-section/page-section.component';
import { ClassificationSectionComponent } from '../home/sections/classification/classification-section.component';

@Component({
  selector: 'app-calculadora-page',
  imports: [
    PageHeroComponent,
    PageSectionComponent,
    ClassificationSectionComponent,
    CtaButtonComponent,
    CtaBandComponent,
  ],
  templateUrl: './calculadora-page.component.html',
  styleUrl: './calculadora-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalculadoraPageComponent {
  protected readonly copy = SITE_COPY;
  protected readonly page = CALCULADORA_COPY;
  protected readonly playStoreUrl = BRAND_TOKENS.links.playStore;

  private readonly pageMeta = inject(PageMetaService);

  constructor() {
    this.pageMeta.apply({
      title: CALCULADORA_COPY.meta.title,
      description: CALCULADORA_COPY.meta.description,
      path: CALCULADORA_COPY.meta.path,
      structuredData: [
        webSiteJsonLd(),
        webPageJsonLd(
          CALCULADORA_COPY.meta.path,
          CALCULADORA_COPY.meta.title,
          CALCULADORA_COPY.meta.description,
        ),
      ],
    });
  }
}
