import { BRAND_TOKENS } from './brand.tokens';

export const SITE_COPY = {
  brand: { name: 'CalcMot', positioning: 'Veja quanto a corrida paga antes de aceitar.' },
  navigation: [
    { label: 'Como funciona', href: '/como-funciona' },
    { label: 'Calculadora de ganhos', href: '/calculadora-ganhos-motorista-app' },
    { label: 'Privacidade', href: '/privacidade' },
    { label: 'Suporte', href: '/suporte' },
  ],
  header: {
    ctaLabel: 'Baixar', ctaAria: 'Baixar o CalcMot na Play Store',
    homeAria: 'CalcMot — página inicial', navAria: 'Páginas do site',
  },
  playStore: { label: 'Baixar na Play Store' },
  hero: {
    eyebrow: 'A oferta passa rápido. A decisão é sua.',
    title: 'Pare de aceitar corrida no escuro.',
    description: 'A oferta aparece e o tempo corre. Veja quanto ela paga por quilômetro e por hora, quanto tempo leva e se está acima da sua meta.',
    primaryCta: 'Baixar na Play Store', secondaryCta: 'Ver como funciona', secondaryHref: '#como-funciona',
    trustLine: 'Android · Uber e 99 · A decisão continua sua',
    image: BRAND_TOKENS.assets.overlayLive,
    alt: 'Oferta real UberX de R$ 10,25 com aviso CalcMot BOA mostrando R$ 2,01 por km, R$ 47,31 por hora e 13 minutos.',
    imageNote: 'A oferta e a conta aparecem juntas na tela.',
    metrics: [
      { label: 'R$/km', value: 'R$ 2,01/km', tone: 'neutral' },
      { label: 'R$/h', value: 'R$ 47,31/h', tone: 'neutral' },
      { label: 'Tempo', value: '13 min', tone: 'neutral' },
      { label: 'Sinal', value: 'BOA', tone: 'good' },
    ],
  },
  productProof: {
    eyebrow: 'Outra oferta real',
    title: 'Mudou a corrida? A conta aparece de novo.',
    description: 'Nesta oferta de R$ 8,75, o aviso mostra R$ 2,13 por quilômetro e R$ 47,73 por hora.',
    image: BRAND_TOKENS.assets.overlayReal,
    alt: 'Outra oferta real UberX de R$ 8,75 com aviso CalcMot BOA mostrando R$ 2,13 por km, R$ 47,73 por hora e 11 minutos.',
    note: 'O valor, o tempo e a distância mudam. Os números acompanham cada oferta.',
  },
  comparison: {
    eyebrow: 'Olhe além do valor',
    title: 'R$ 30 pode ser ruim. R$ 14 pode ser boa.',
    description: 'Uma corrida maior pode levar seu tempo e render pouco por quilômetro. Compare antes de aceitar.',
    note: 'Exemplos visuais para explicar a lógica. Não representam garantia de ganho.',
    offers: [
      { label: 'Oferta A', value: 'R$ 30', time: '42 min', distance: '21 km', perKm: 'R$ 1,42/km', verdict: 'RUIM', detail: 'Abaixo da meta', tone: 'bad' },
      { label: 'Oferta B', value: 'R$ 14', time: '12 min', distance: '4,8 km', perKm: 'R$ 2,91/km', verdict: 'ÓTIMA', detail: 'Muito acima da meta', tone: 'great' },
    ],
  },
  timeline: {
    eyebrow: 'Na hora da oferta', title: 'Veja a conta antes de tocar em aceitar.',
    description: 'A oferta dura pouco. Os números aparecem enquanto você ainda pode escolher.',
    steps: [
      { number: '01', title: 'A oferta aparece', detail: 'Você vê valor, tempo e distância.' },
      { number: '02', title: 'A conta aparece junto', detail: 'Quanto paga por quilômetro e por hora, com um sinal claro.' },
      { number: '03', title: 'Você escolhe', detail: 'Decida com os números na mão.' },
    ],
    linkLabel: 'Entenda o funcionamento', linkHref: '/como-funciona',
  },
  classifications: {
    eyebrow: 'Sinais claros', title: 'Quatro sinais para decidir mais rápido.',
    description: 'Compare a oferta com a meta que você definiu.',
    note: 'Cada aviso é um exemplo visual. A classificação usa os dados disponíveis e a meta que você definiu.',
    items: [
      { tone: 'great', label: 'ÓTIMA', meaning: 'Muito acima da meta.', perKm: 'R$ 2,41/km', perHour: 'R$ 48/h', time: '18 min' },
      { tone: 'good', label: 'BOA', meaning: 'Dentro da meta.', perKm: 'R$ 2,01/km', perHour: 'R$ 47,31/h', time: '13 min' },
      { tone: 'warning', label: 'MÉDIA', meaning: 'No limite.', perKm: 'R$ 1,50/km', perHour: 'R$ 35/h', time: '20 min' },
      { tone: 'bad', label: 'RUIM', meaning: 'Abaixo da meta.', perKm: 'R$ 1,42/km', perHour: 'R$ 30/h', time: '42 min' },
    ],
  },
  compatibility: {
    eyebrow: 'Compatibilidade', title: 'Feito para Android, Uber e 99.',
    description: 'O CalcMot organiza os números da oferta para você decidir melhor.',
    apps: ['Android', 'Uber', '99'],
    note: 'O CalcMot não é oficial da Uber ou da 99. A compatibilidade pode variar por versão do Android, aparelho e app de motorista.',
  },
  trust: {
    eyebrow: 'Você decide', title: 'Você no comando de cada corrida.',
    disclaimer: 'O CalcMot faz as contas. Você escolhe a corrida.',
    limits: 'Ele não aceita nem recusa corridas e não controla Uber ou 99. O cálculo é uma estimativa.',
    items: ['Não aceita corridas', 'Não recusa corridas', 'Não controla Uber ou 99', 'Não promete lucro garantido', 'Não é oficial da Uber/99', 'A decisão é sua'],
    linkLabel: 'Privacidade e permissões', linkHref: '/privacidade',
  },
  faq: {
    eyebrow: 'Dúvidas frequentes', title: 'Antes de baixar',
    items: [
      { question: 'O CalcMot aceita ou recusa corridas por mim?', answer: 'Não. O CalcMot não aceita, não recusa e não toca na tela. Ele mostra os números para você decidir.' },
      { question: 'O CalcMot é oficial da Uber ou da 99?', answer: 'Não. O CalcMot não é oficial, patrocinado ou afiliado à Uber ou à 99.' },
      { question: 'A classificação garante lucro?', answer: 'Não. O sinal é uma estimativa feita com o valor, o tempo, a distância e a meta que você escolheu.' },
      { question: 'Por que o app usa acessibilidade?', answer: 'Porque as ofertas aparecem em outro app e duram poucos segundos. A permissão ajuda o CalcMot a identificar informações visíveis e mostrar o cálculo.' },
      { question: 'Funciona em qualquer Android?', answer: 'A compatibilidade pode variar por versão do Android, modelo do aparelho e app de motorista.' },
    ],
    linkLabel: 'Ver todas as dúvidas', linkHref: '/suporte',
  },
  finalCta: {
    title: 'Baixe antes do próximo turno.',
    description: 'Veja quanto a corrida paga por quilômetro e por hora antes de aceitar.',
    button: 'Baixar na Play Store', secondaryLabel: 'Ver como funciona',
    secondaryHref: '/como-funciona', note: 'Android · Uber e 99 · A decisão continua sua',
  },
  footer: {
    positioning: 'Veja quanto a corrida paga antes de aceitar.',
    disclaimer: 'O CalcMot é um app independente. Não é oficial da Uber nem da 99.',
    autonomy: 'A decisão continua sua.', navAria: 'Páginas do site no rodapé',
  },
} as const;
