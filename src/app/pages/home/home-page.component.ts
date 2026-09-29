import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SITE_COPY } from '../../core/constants/site-copy';
import { PageMetaService } from '../../core/services/page-meta.service';
import {
  faqJsonLd,
  softwareApplicationJsonLd,
  webSiteJsonLd,
} from '../../core/seo/structured-data';
import { CtaBandComponent } from '../../shared/components/cta-band/cta-band.component';
import { FaqListComponent } from '../../shared/components/faq-list/faq-list.component';
import { ProductProofComponent } from '../../shared/components/product-proof/product-proof.component';
import { ClassificationSectionComponent } from './sections/classification/classification-section.component';
import { HeroComponent } from './sections/hero/hero.component';
import { HowItWorksComponent } from './sections/how-it-works/how-it-works.component';
import { OfferComparisonComponent } from './sections/offer-comparison/offer-comparison.component';

@Component({
  selector: 'app-home-page',
  imports: [
    HeroComponent,
    ProductProofComponent,
    OfferComparisonComponent,
    HowItWorksComponent,
    ClassificationSectionComponent,
    FaqListComponent,
    CtaBandComponent,
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  protected readonly copy = SITE_COPY;

  private readonly pageMeta = inject(PageMetaService);

  constructor() {
    this.pageMeta.apply({
      title: 'CalcMot — veja R$/km e R$/h antes de aceitar corridas',
      description:
        'O CalcMot ajuda motoristas de app a visualizar R$/km, R$/h, tempo e classificação da oferta antes de decidir. Android, Uber e 99.',
      path: '/',
      structuredData: [
        webSiteJsonLd(),
        softwareApplicationJsonLd(
          'App Android que lê a oferta visível no app de corrida e mostra R$/km, R$/h e uma classificação antes de o motorista decidir.',
        ),
        faqJsonLd(SITE_COPY.faq.items),
      ],
    });
  }
}
