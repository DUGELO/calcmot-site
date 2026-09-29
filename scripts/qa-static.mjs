import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const exists = (path) => existsSync(resolve(root, path));

const failures = [];
const check = (ok, label) => {
  if (!ok) failures.push(label);
};

const walk = (dir, extension) => {
  const out = [];

  for (const entry of readdirSync(resolve(root, dir), { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;

    if (entry.isDirectory()) {
      out.push(...walk(path, extension));
    } else if (entry.name.endsWith(extension)) {
      out.push(path);
    }
  }

  return out;
};

const routePaths = () => {
  const source = read('src/app/app.routes.ts');
  const matches = [...source.matchAll(/path:\s*'([^']*)'/g)].map((match) => match[1]);

  return [...new Set(matches)].filter((path) => path !== '**' && path !== 'cosmos');
};

const PAGES = [
  { route: '', copy: null, component: 'src/app/pages/home/home-page.component.ts' },
  {
    route: '/como-funciona',
    copy: 'src/app/core/constants/pages/como-funciona.copy.ts',
    component: 'src/app/pages/como-funciona/como-funciona-page.component.ts',
  },
  {
    route: '/calculadora-ganhos-motorista-app',
    copy: 'src/app/core/constants/pages/calculadora.copy.ts',
    component: 'src/app/pages/calculadora/calculadora-page.component.ts',
  },
  {
    route: '/privacidade',
    copy: 'src/app/core/constants/pages/privacidade.copy.ts',
    component: 'src/app/pages/privacidade/privacidade-page.component.ts',
  },
  {
    route: '/suporte',
    copy: 'src/app/core/constants/pages/suporte.copy.ts',
    component: 'src/app/pages/suporte/suporte-page.component.ts',
  },
];

const REQUIRED_FILES = [
  'src/app/core/constants/brand.tokens.ts',
  'src/app/core/constants/site-copy.ts',
  'src/app/core/constants/pages/page-copy.types.ts',
  'src/app/core/constants/pages/como-funciona.copy.ts',
  'src/app/core/constants/pages/calculadora.copy.ts',
  'src/app/core/constants/pages/privacidade.copy.ts',
  'src/app/core/constants/pages/suporte.copy.ts',
  'src/app/core/services/page-meta.service.ts',
  'src/app/core/seo/structured-data.ts',
  'src/app/shared/components/header/header.component.ts',
  'src/app/shared/components/site-footer/site-footer.component.ts',
  'src/app/shared/components/cta-button/cta-button.component.ts',
  'src/app/shared/components/cta-band/cta-band.component.ts',
  'src/app/shared/components/page-hero/page-hero.component.ts',
  'src/app/shared/components/page-section/page-section.component.ts',
  'src/app/shared/components/offer-alert/offer-alert.component.ts',
  'src/app/shared/components/phone-mockup/phone-mockup.component.ts',
  'src/app/shared/components/product-proof/product-proof.component.ts',
  'src/app/shared/components/trust-strip/trust-strip.component.ts',
  'src/app/shared/components/faq-list/faq-list.component.ts',
  'src/app/pages/home/home-page.component.ts',
  'src/app/pages/home/sections/hero/hero.component.ts',
  'src/app/pages/home/sections/offer-comparison/offer-comparison.component.ts',
  'src/app/pages/home/sections/how-it-works/how-it-works.component.ts',
  'src/app/pages/home/sections/classification/classification-section.component.ts',
  'src/app/pages/como-funciona/como-funciona-page.component.ts',
  'src/app/pages/calculadora/calculadora-page.component.ts',
  'src/app/pages/privacidade/privacidade-page.component.ts',
  'src/app/pages/suporte/suporte-page.component.ts',
  'src/app/app.component.html',
  'src/app/app.routes.server.ts',
  'src/main.server.ts',
  'src/server.ts',
  'src/assets/screenshots/.gitkeep',
  'src/assets/screenshots/README.md',
  'public/robots.txt',
];

check(
  REQUIRED_FILES.every((path) => exists(path)),
  `Arquivos ausentes: ${REQUIRED_FILES.filter((path) => !exists(path)).join(', ')}`,
);

const routes = routePaths();
const serverRoutes = read('src/app/app.routes.server.ts');
const tokens = read('src/app/core/constants/brand.tokens.ts');
const styles = read('src/styles.scss').toLowerCase();
const indexHtml = read('src/index.html');
const hero = read('src/app/pages/home/sections/hero/hero.component.html');
const homeComponent = read('src/app/pages/home/home-page.component.ts');
const homeTemplate = read('src/app/pages/home/home-page.component.html');
const classification = read(
  'src/app/pages/home/sections/classification/classification-section.component.html',
);
const phoneTemplate = read('src/app/shared/components/phone-mockup/phone-mockup.component.html');
const offerAlert = read('src/app/shared/components/offer-alert/offer-alert.component.html');
const faqList = read('src/app/shared/components/faq-list/faq-list.component.html');
const pageSection = read('src/app/shared/components/page-section/page-section.component.html');
const appShell = read('src/app/app.component.html');
const header = read('src/app/shared/components/header/header.component.html');
const headerStyles = read('src/app/shared/components/header/header.component.scss');
const angularConfig = read('angular.json');
const packageJson = read('package.json');
const siteCopy = read('src/app/core/constants/site-copy.ts');

const EXPECTED_ROUTES = [
  '',
  'como-funciona',
  'calculadora-ganhos-motorista-app',
  'privacidade',
  'suporte',
];

check(
  EXPECTED_ROUTES.length === routes.length && EXPECTED_ROUTES.every((path) => routes.includes(path)),
  `Rotas esperadas divergentes: ${routes.join(', ')}`,
);
check(
  EXPECTED_ROUTES.every((path) => serverRoutes.includes(`path: '${path}'`)),
  'Todas as rotas públicas declaradas em app.routes.server.ts',
);
check(
  EXPECTED_ROUTES.every((path) =>
    serverRoutes.includes(`path: '${path}', renderMode: RenderMode.Prerender`),
  ),
  'Rotas públicas configuradas para prerender estático',
);
check(
  serverRoutes.includes("path: '**', renderMode: RenderMode.Server"),
  'SSR local preservado como fallback para rotas não prerenderizadas',
);

for (const page of PAGES) {
  const label = page.route || '/';
  const component = read(page.component);

  check(component.includes('inject(PageMetaService)'), `${label}: injeta PageMetaService`);
  check(component.includes('pageMeta.apply('), `${label}: aplica metadata da página`);

  if (page.copy) {
    const copy = read(page.copy);
    check(copy.includes(`path: '${page.route}'`), `${label}: caminho canônico na copy`);
    check(copy.includes('title:') && copy.includes('description:'), `${label}: título e descrição`);
  }
}

check(
  homeComponent.includes('faqJsonLd') && homeComponent.includes('softwareApplicationJsonLd'),
  'Dados estruturados da home (WebSite, SoftwareApplication, FAQ)',
);
check(
  read('src/app/core/seo/structured-data.ts').includes('const absoluteUrl'),
  'URLs absolutas de SEO condicionadas ao domínio canônico',
);
check(
  read('src/app/core/services/page-meta.service.ts').includes('if (canonicalUrl)'),
  'Canonical e og:url só quando existe domínio canônico',
);
check(tokens.includes("url: ''"), 'Domínio canônico vazio até confirmação (sem chute)');
check(tokens.includes("supportEmail: ''"), 'Canal de suporte não exposto sem confirmação');
check(tokens.includes('ogImage: null'), 'og:image preparado sem imagem inventada');
check(
  tokens.includes('https://play.google.com/store/apps/details?id=br.com.calcmot'),
  'URL da Play Store',
);
check(styles.includes('--color-great: #9c2a9a'), 'token ÓTIMA #9C2A9A');
check(styles.includes('--color-brand-green: #61e329'), 'token verde da marca');
check(styles.includes('prefers-reduced-motion'), 'reduced motion');
check(styles.includes('focus-visible'), 'foco visível');
check(styles.includes('--header-height'), 'altura do header usada no scroll-padding');
check(
  indexHtml.includes('app-root:empty + .static-fallback') && indexHtml.includes('br.com.calcmot'),
  'fallback estático quando o bootstrap não está disponível',
);
check(
  indexHtml.includes('play-lh.googleusercontent.com') && indexHtml.includes('rel="icon"'),
  'favicon usando asset real publicado',
);
check(indexHtml.includes('<html lang="pt-BR">'), 'idioma pt-BR no documento');
check(appShell.includes('id="conteudo"') && appShell.includes('class="skip-link"'), 'link de salto');
check(
  siteCopy.includes('Android · Uber e 99 · A decisão continua sua'),
  'linha de confiança abaixo do hero',
);
check(
  siteCopy.includes('limits: \'Ele não aceita nem recusa corridas e não controla Uber ou 99. O cálculo é uma estimativa.'),
  'limites de autonomia reunidos em uma nota concisa',
);
check(hero.includes('copy.hero.trustLine'), 'trust line renderizada no hero');
check(
  hero.includes('<img [src]="copy.hero.image"') &&
    hero.includes('[alt]="copy.hero.alt"') &&
    hero.includes('loading="eager"') &&
    hero.includes('fetchpriority="high"') &&
    hero.includes('copy.hero.imageNote') &&
    siteCopy.includes("value: 'R$ 2,01/km'") &&
    siteCopy.includes("value: 'R$ 47,31/h'") &&
    siteCopy.includes("value: '13 min'") &&
    siteCopy.includes("value: 'BOA'"),
  'hero exibe captura real prioritária, métricas correspondentes e legenda',
);
check(
  phoneTemplate.includes('phone__screen--demo') &&
    phoneTemplate.includes('R$ 14,40') &&
    phoneTemplate.includes('R$ 2,41') &&
    phoneTemplate.includes('R$ 48') &&
    phoneTemplate.includes('ÓTIMA'),
  'telefone demonstrativo com métricas e classificação',
);
check(
  phoneTemplate.includes('[ngSrc]="src()!"') &&
    phoneTemplate.includes('[width]="width()"') &&
    phoneTemplate.includes('!imageFailed()'),
  'phone mockup preserva imagem opcional com dimensões e fallback',
);
check(
  offerAlert.includes('{{ perKm() }}') &&
    offerAlert.includes('{{ perHour() }}') &&
    offerAlert.includes('exampleLabel()'),
  'componente de aviso com R$/km, R$/h e rótulo de exemplo',
);
check(
  classification.includes('copy.classifications.items') &&
    classification.includes('item.label') &&
    classification.includes('item.meaning'),
  'quatro classificações textuais',
);
check(
  homeTemplate.includes('app-product-proof') &&
    homeTemplate.includes('[image]="copy.productProof.image"'),
  'recorte de captura real do produto na home',
);
check(
  homeTemplate.includes('app-faq-list') && homeTemplate.includes('app-cta-band'),
  'FAQ e CTA final na home',
);
check(faqList.includes('[open]="first"'), 'apenas primeira FAQ aberta por padrão');
check(
  pageSection.includes('section().formulas') && pageSection.includes('section().steps'),
  'seções de conteúdo com fórmulas e passos',
);
check(
  header.includes('copy.navigation') && header.includes('copy.header.ctaLabel'),
  'navegação e CTA sempre presentes no header',
);
check(
  headerStyles.includes('min-height: 44px') && headerStyles.includes('overflow-x: auto'),
  'alvos de toque do header com 44px e rolagem em telas pequenas',
);
check(
  angularConfig.includes('"input": "src/assets"') && angularConfig.includes('"output": "assets"'),
  'src/assets incluído no build Angular',
);
check(
  packageJson.includes('"qa:static"') && packageJson.includes('"seo:sitemap"'),
  'scripts de QA e sitemap declarados no package.json',
);

const appTs = walk('src/app', '.ts');
const appHtml = walk('src/app', '.html');
const scannedText = [...appTs, ...appHtml].map((path) => read(path)).join('\n');
const scannedLower = scannedText.toLowerCase();

const FORBIDDEN = [
  'revolucione',
  'potencialize',
  'maximize seus ganhos',
  'transforme sua jornada',
  'solução inovadora',
  'inteligência avançada',
  'tecnologia de ponta',
  'ganho garantido',
  'ganhos garantidos',
  'renda garantida',
  'resultado garantido',
  'garantia de lucro',
  'fique rico',
  'dinheiro fácil',
  'sem esforço',
  'infalível',
  'câmera secreta',
  'robô',
  'hack',
  'aceite automaticamente',
  'recusa automaticamente',
  'cobrar automaticamente',
];

for (const phrase of FORBIDDEN) {
  check(!scannedLower.includes(phrase), `Copy proibida encontrada: "${phrase}"`);
}

const sentences = scannedText.split(/[.\n!?·]+/);
const NEGATED = /\b(não|nao|sem|nunca|nenhum|nenhuma|nem)\b/i;
const AFFILIATION =
  /\b(oficial|parceria|vínculo|vinculo)\b[^.\n]{0,60}?\b(uber|99|plataforma|plataformas|apps? de corrida|aplicativos? de corrida)\b/i;

for (const raw of sentences) {
  const sentence = raw.trim();

  if (!sentence) {
    continue;
  }

  if (/\bquestion:\s*['"]/.test(sentence)) {
    continue;
  }

  const negated = NEGATED.test(sentence);

  check(
    negated || !AFFILIATION.test(sentence),
    `Alegação de app/parceria oficial sem negação: "${sentence}"`,
  );
  check(negated || !/\bparceria\b/i.test(sentence), `Parceria citada sem negação: "${sentence}"`);
  const resultGuarantee = /\b(lucro|ganho|ganhos|renda|resultado|faturamento)\s+garantid[oa]s?\b/i.test(sentence);
  const closeNegation = /\b(não|nao|sem)\b[^.!?\n]{0,30}\b(promete|oferece|existe|há|ha|garante)?\b[^.!?\n]{0,30}\b(lucro|ganho|ganhos|renda|resultado|faturamento)\s+garantid[oa]s?\b/i.test(sentence);
  check(!resultGuarantee || closeNegation, `Promessa de resultado sem negação próxima: "${sentence}"`);
}

const assetFiles = [
  ...new Set(
    [...appTs, ...appHtml]
      .map((path) => read(path))
      .join('\n')
      .matchAll(/\/assets\/screenshots\/([\w.-]+)/g),
  ),
].map((row) => row[1]);

check(assetFiles.length >= 1, `Captura real referenciada no código: ${assetFiles.length}`);
for (const file of assetFiles) {
  check(exists(`src/assets/screenshots/${file}`), `Captura ausente em src/assets: ${file}`);
}
check(!/\/assets\/screenshots\/[\w.-]+\.png/.test(scannedText), 'Sem referência a screenshot .png (MIME errado)');
check(
  exists('scripts/generate-sitemap.mjs') && read('scripts/generate-sitemap.mjs').includes('app.routes.ts'),
  'Gerador de sitemap usando as rotas como fonte única',
);
check(
  read('scripts/generate-sitemap.mjs').includes('site.url'),
  'Sitemap condicionado ao domínio canônico',
);
check(
  read('public/robots.txt').includes('User-agent: *') && !read('public/robots.txt').includes('Disallow: /'),
  'robots.txt libera o rastreamento',
);

if (failures.length > 0) {
  console.error('QA estático falhou:');
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }

  process.exit(1);
}

console.log('QA estático OK: rotas, SEO/metadata, SSR, exemplo visual, captura real, tokens, acessibilidade e guardrails de copy.');



