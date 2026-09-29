import type { Routes } from '@angular/router';
import { CalculadoraPageComponent } from './pages/calculadora/calculadora-page.component';
import { ComoFuncionaPageComponent } from './pages/como-funciona/como-funciona-page.component';
import { HomePageComponent } from './pages/home/home-page.component';
import { PrivacidadePageComponent } from './pages/privacidade/privacidade-page.component';
import { SuportePageComponent } from './pages/suporte/suporte-page.component';

export const routes: Routes = [
  {
    path: '',
    component: HomePageComponent,
    title: 'CalcMot — veja R$/km e R$/h antes de aceitar corridas',
  },
  {
    path: 'como-funciona',
    component: ComoFuncionaPageComponent,
    title: 'Como o CalcMot lê a oferta antes de você decidir — CalcMot',
  },
  {
    path: 'calculadora-ganhos-motorista-app',
    component: CalculadoraPageComponent,
    title: 'Calculadora de ganhos do motorista de app: R$/km e R$/h — CalcMot',
  },
  {
    path: 'privacidade',
    component: PrivacidadePageComponent,
    title: 'Privacidade: o que o CalcMot lê e o que ele não faz — CalcMot',
  },
  {
    path: 'suporte',
    component: SuportePageComponent,
    title: 'Suporte e diagnóstico — CalcMot',
  },
  { path: '**', redirectTo: '' },
];
