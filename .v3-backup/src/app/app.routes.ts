import type { Routes } from '@angular/router';
import { LandingPageComponent } from './landing/landing-page.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent,
    title: 'CalcMot — clareza para quem decide no volante',
  },
  { path: '**', redirectTo: '' },
];
