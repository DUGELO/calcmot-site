import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
} from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { toSignal } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { filter, map } from "rxjs";
import { HeaderComponent } from "./shared/components/header/header.component";
import { SiteFooterComponent } from "./shared/components/site-footer/site-footer.component";
import { SiteAnalyticsService } from "./core/services/site-analytics.service";
@Component({
  selector: "app-root",
  imports: [RouterOutlet, HeaderComponent, SiteFooterComponent],
  templateUrl: "./app.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly path = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.split(/[?#]/)[0]),
    ),
    {
      initialValue:
        this.document.defaultView?.location.pathname ?? this.router.url,
    },
  );
  readonly isAdmin = computed(() => /^\/admin(?:\/|$)/.test(this.path()));
  readonly skipLink = computed(() =>
    this.isAdmin() ? this.path() + "#conteudo" : "#conteudo",
  );
  private readonly analytics = inject(SiteAnalyticsService);
  constructor() {
    afterNextRender(() => this.analytics.initialize());
  }
}
