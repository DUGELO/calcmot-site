import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { BRAND_TOKENS } from '../core/constants/brand.tokens';
import { HeaderComponent } from '../shared/components/header/header.component';
import { ClassificationSectionComponent } from './classification-section/classification-section.component';
import { FinalCtaSectionComponent } from './final-cta-section/final-cta-section.component';
import { HeroComponent } from './hero/hero.component';
import { HowItWorksSectionComponent } from './how-it-works-section/how-it-works-section.component';
import { OfferComparisonSectionComponent } from './offer-comparison-section/offer-comparison-section.component';
import { PrivacySectionComponent } from './privacy-section/privacy-section.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    HeaderComponent,
    HeroComponent,
    OfferComparisonSectionComponent,
    HowItWorksSectionComponent,
    ClassificationSectionComponent,
    PrivacySectionComponent,
    FinalCtaSectionComponent,
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    const pageTitle = 'CalcMot — pare de aceitar corrida no escuro';
    const description = 'Veja R$/km, R$/h, tempo e uma classificação da oferta antes de decidir. A decisão continua sua.';

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: 'index,follow' });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:locale', content: 'pt_BR' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });

    const ogImage = BRAND_TOKENS.assets.ogImage;
    if (ogImage) {
      this.meta.updateTag({ property: 'og:image', content: ogImage });
      this.meta.updateTag({ name: 'twitter:image', content: ogImage });
      this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    }
  }
}
