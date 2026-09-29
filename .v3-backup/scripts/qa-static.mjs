import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const required = [
  'src/app/core/constants/brand.tokens.ts',
  'src/app/core/constants/site-copy.ts',
  'src/app/shared/components/header/header.component.ts',
  'src/app/shared/components/cta-button/cta-button.component.ts',
  'src/app/shared/components/feature-card/feature-card.component.ts',
  'src/app/shared/components/classification-badge/classification-badge.component.ts',
  'src/app/shared/components/phone-mockup/phone-mockup.component.ts',
  'src/app/landing/landing-page.component.ts',
  'src/app/app.routes.server.ts',
  'src/main.server.ts',
  'src/server.ts',
  'src/assets/brand/.gitkeep',
  'src/assets/screenshots/.gitkeep',
  'src/assets/brand/README.md',
  'src/assets/screenshots/README.md',
];

const missing = required.filter((path) => !existsSync(resolve(root, path)));
if (missing.length) throw new Error(`Arquivos ausentes: ${missing.join(', ')}`);

const copy = read('src/app/core/constants/site-copy.ts');
const tokens = read('src/app/core/constants/brand.tokens.ts');
const styles = read('src/styles.scss').toLowerCase();
const serverRoutes = read('src/app/app.routes.server.ts');
const phoneMockup = read('src/app/shared/components/phone-mockup/phone-mockup.component.html');
const hero = read('src/app/landing/hero/hero.component.html');
const classification = read('src/app/landing/classification-section/classification-section.component.html');
const faq = read('src/app/landing/faq-section/faq-section.component.html');
const angularConfig = read('angular.json');
const ctaStyles = read('src/app/shared/components/cta-button/cta-button.component.scss');
const headerStyles = read('src/app/shared/components/header/header.component.scss');
const phoneComponent = read('src/app/shared/components/phone-mockup/phone-mockup.component.ts');
const landingComponent = read('src/app/landing/landing-page.component.ts');
const indexHtml = read('src/index.html');

const assertions = [
  [indexHtml.includes('app-root:empty + .static-fallback') && indexHtml.includes('https://play.google.com/store/apps/details?id=br.com.calcmot'), 'fallback estático quando o bootstrap não está disponível'],
  [copy.includes('Pare de aceitar corrida no escuro.'), 'hero aprovado'],
  [copy.includes('O CalcMot não aceita, não recusa e não controla apps de corrida.'), 'disclaimer de autonomia'],
  [tokens.includes('https://play.google.com/store/apps/details?id=br.com.calcmot'), 'URL da Play Store'],
  [styles.includes('--color-great: #9c2a9a'), 'token ÓTIMA #9C2A9A'],
  [serverRoutes.includes('RenderMode.Server'), 'SSR RenderMode.Server'],
  [styles.includes('prefers-reduced-motion'), 'reduced motion'],
  [copy.includes('Android · Uber e 99 · A decisão continua sua'), 'linha de confiança abaixo do hero'],
  [phoneMockup.includes('R$ 2,41/km') && phoneMockup.includes('R$ 48/h') && phoneMockup.includes('43 min'), 'números realistas no overlay'],
  [phoneMockup.includes('exemplo visual'), 'microcopy exemplo visual'],
  [hero.includes('copy.trustLine'), 'trust line renderizada no hero'],
  [classification.includes('app-cta-button'), 'CTA após classificações'],
  [faq.includes('let isFirst = $first') && faq.includes('[attr.open]'), 'apenas primeira FAQ aberta por padrão'],
  [angularConfig.includes('\"input\": \"src/assets\"') && angularConfig.includes('\"output\": \"assets\"'), 'src/assets incluído no build Angular'],
  [ctaStyles.includes('white-space: nowrap'), 'CTA sem quebra de linha'],
  [headerStyles.includes('flex: 0 0 auto'), 'CTA do header sem encolhimento'],
  [tokens.includes("overlayScreenshot: '/assets/screenshots/overlay-real.png'"), 'caminho opcional do screenshot real'],
  [phoneComponent.includes('screenshotSrc') && phoneMockup.includes('phone__real-screenshot'), 'phone mockup preparado para screenshot real com fallback'],
  [tokens.includes('ogImage: null') && landingComponent.includes('if (ogImage)'), 'og:image preparado sem imagem inventada'],
  [indexHtml.includes('play-lh.googleusercontent.com') && indexHtml.includes('rel=\"icon\"'), 'favicon usando asset real publicado'],
];

for (const [ok, label] of assertions) {
  if (!ok) throw new Error(`Falhou: ${label}`);
}

const forbidden = [
  'revolucione',
  'potencialize',
  'maximize seus ganhos',
  'transforme sua jornada',
  'solução inovadora',
  'inteligência avançada',
  'tecnologia de ponta',
  'ganho garantido',
  'ganhe mais garantido',
  'renda garantida',
  'lucro líquido exato',
  'câmera secreta',
  'robô',
  'hack',
  'aceite automaticamente',
  'recusa automaticamente',
];

for (const phrase of forbidden) {
  if (copy.toLowerCase().includes(phrase.toLowerCase())) {
    throw new Error(`Copy proibida encontrada: ${phrase}`);
  }
}

const officialMatches = copy.match(/(?<!não\s+é\s+|sem\s+fingir\s+)(oficial\s+(?:da\s+)?(?:uber|99)|parceria\s+oficial)/gi);
if (officialMatches) {
  throw new Error(`Alegação proibida de app/parceria oficial encontrada: ${officialMatches.join(', ')}`);
}

const profitMatches = copy.match(/(?<!não\s+promete\s+|sem\s+promessa\s+de\s+)lucro\s+garantido/gi);
if (profitMatches) {
  throw new Error(`Promessa de lucro garantido encontrada: ${profitMatches.join(', ')}`);
}

console.log('QA estático OK: estrutura, SSR, hero, Play Store, tokens, acessibilidade e guardrails conferidos.');
