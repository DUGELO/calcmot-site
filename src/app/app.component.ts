import { ChangeDetectionStrategy, Component, afterNextRender, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { SiteFooterComponent } from './shared/components/site-footer/site-footer.component';
import { SiteAnalyticsService } from './core/services/site-analytics.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, SiteFooterComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly analytics = inject(SiteAnalyticsService);

  constructor() {
    afterNextRender(() => this.analytics.initialize());
  }
}

