import type { Routes, ActivatedRouteSnapshot } from '@angular/router';
import { BLOG_REDIRECTS } from './generated/routes';
import { BLOG_BODIES } from './generated/bodies';
import { BlogPageComponent } from './blog-page.component';

export const BLOG_ROUTES: Routes = [
  { path: '', component: BlogPageComponent },
  { path: 'pagina/:page', component: BlogPageComponent },
  { path: 'categoria/:category/pagina/:page', component: BlogPageComponent },
  { path: 'categoria/:category', component: BlogPageComponent },
  ...Object.entries(BLOG_REDIRECTS).map(([path, target]) => ({
    path, redirectTo: target, pathMatch: 'full' as const,
  })),
  {
    path: ':slug', component: BlogPageComponent,
    resolve: { body: (route: ActivatedRouteSnapshot) => BLOG_BODIES[route.paramMap.get('slug') ?? '']?.() ?? '' },
  },
  { path: '**', component: BlogPageComponent, data: { notFound: true } },
];
