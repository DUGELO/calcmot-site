export const SITE_COPY = {
  brand: {
    name: 'CalcMot',
    positioning: 'O cockpit financeiro-operacional do motorista de app.',
  },
  navigation: [
    { label: 'Como funciona', href: '#como-funciona' },
    { label: 'Comparar ofertas', href: '#comparacao' },
    { label: 'Classificações', href: '#classificacoes' },
    { label: 'Privacidade', href: '#privacidade' },
  ],
  hero: {
    title: 'Pare de aceitar corrida no escuro.',
    description:
      'A oferta aparece. O tempo corre. O valor parece bom. O CalcMot mostra R$/km, R$/h, tempo e uma classificação antes de você decidir.',
    primaryCta: 'Baixar na Play Store',
    secondaryCta: 'Ver exemplo',
    disclaimer:
      'O CalcMot não aceita, não recusa e não controla apps de corrida. Mostra os números. Não toca na tela. A decisão continua sua.',
    trustLine: 'Android · Uber e 99 · A decisão continua sua',
  },
  problem: {
    eyebrow: 'Leitura rápida · exemplos visuais',
    title: 'R$ 30 pode ser ruim. R$ 14 pode ser boa.',
    description:
      'O valor total engana quando você ignora distância, tempo e deslocamento. O CalcMot transforma a oferta em métricas de decisão.',
    points: [
      { title: 'Valor total é só o começo.' },
      { title: 'Tempo muda a conta.' },
      { title: 'Sua meta dá contexto.' },
    ],
  },
  comparison: {
    eyebrow: 'Dois cenários · mesma decisão',
    title: 'R$ 30 pode ser ruim. R$ 14 pode ser boa.',
    description: 'O valor total engana quando você ignora tempo, distância e deslocamento. O CalcMot transforma a oferta em métricas de decisão.',
    note: 'Os números e classificações abaixo são exemplos visuais, não resultados prometidos.',
    offers: [
      {
        label: 'Oferta A',
        route: 'Centro → bairro',
        value: 'R$ 30',
        perKm: 'R$ 1,43',
        perHour: 'R$ 42/h',
        time: '42 min',
        distance: '21 km',
        verdict: 'RUIM',
        detail: 'muito tempo na rua',
        tone: 'bad',
      },
      {
        label: 'Oferta B',
        route: 'Zona sul → centro',
        value: 'R$ 14',
        perKm: 'R$ 2,92',
        perHour: 'R$ 70/h',
        time: '12 min',
        distance: '4,8 km',
        verdict: 'ÓTIMA',
        detail: 'acima da sua meta',
        tone: 'great',
      },
    ],
  },
  overlay: {
    eyebrow: 'O overlay entra em campo',
    title: 'O número aparece onde a decisão acontece.',
    description:
      'Sem planilha. Sem conta de cabeça. Sem aceitar no impulso. Uma leitura curta sobre a oferta visível, enquanto ela ainda está na sua tela.',
  },
  classifications: {
    eyebrow: 'Classificações',
    title: 'ÓTIMA, BOA, MÉDIA ou RUIM. Sem adivinhação.',
    description:
      'Você define a meta. O CalcMot compara a oferta. A cor ajuda. Os números explicam.',
    items: [
      { tone: 'great', label: 'ÓTIMA', detail: 'Muito acima da meta' },
      { tone: 'good', label: 'BOA', detail: 'Dentro das duas metas' },
      { tone: 'warning', label: 'MÉDIA', detail: 'No limite' },
      { tone: 'bad', label: 'RUIM', detail: 'Abaixo das metas' },
    ],
  },
  howItWorks: {
    eyebrow: 'Como funciona',
    title: 'O número aparece onde a decisão acontece.',
    steps: [
      { number: '01', title: 'A oferta aparece.' },
      { number: '02', title: 'O CalcMot lê os dados visíveis.' },
      { number: '03', title: 'R$/km, R$/h e tempo aparecem no overlay.' },
      { number: '04', title: 'Você decide.' },
    ],
  },
  compatibility: {
    eyebrow: 'Uber e 99',
    title: 'No Uber e na 99 que você já usa.',
    description:
      'O CalcMot lê a oferta visível e calcula. Não assume o volante, não toca na tela e não controla o app.',
    disclaimer: 'Não é oficial da Uber ou da 99.',
  },
  cockpit: {
    eyebrow: 'Cockpit financeiro-operacional',
    title: 'Depois da corrida, ainda tem o dia.',
    description:
      'Meta, histórico, custos e ganhos confirmados para você entender como o dia fechou.',
    items: ['Metas', 'Histórico', 'Custos', 'Ganhos confirmados', 'Comparações', 'Relatórios'],
  },
  privacy: {
    eyebrow: 'Controle e transparência',
    title: 'Sem automação escondida. Sem promessa de lucro. Sem fingir parceria oficial.',
    description:
      'O CalcMot não aceita, não recusa e não controla apps de corrida. Ele mostra os números. Não toca na tela. A decisão continua sua.',
    points: [
      'Não aceita por você',
      'Não recusa por você',
      'Não controla Uber/99',
      'Não promete lucro garantido',
      'Não é oficial Uber/99',
    ],
  },
  proof: {
    eyebrow: 'Feito para a hora da oferta',
    title: 'Menos conta mental. Mais clareza.',
    items: [
      'Mostra R$/km, R$/h e tempo.',
      'Compara com a sua meta.',
      'Classifica a oferta na hora.',
      'Deixa a decisão nas suas mãos.',
    ],
  },
  faq: {
    eyebrow: 'Dúvidas frequentes',
    title: 'FAQ',
    items: [
      {
        question: 'Por que acessibilidade?',
        answer:
          'Porque a oferta aparece no Uber ou na 99. A permissão permite ler o que está visível e mostrar o cálculo. O CalcMot não toca na tela.',
      },
      {
        question: 'O CalcMot aceita ou recusa corridas?',
        answer: 'Não. Ele mostra os números. Aceitar ou recusar continua sendo com você.',
      },
      {
        question: 'Como a classificação funciona?',
        answer:
          'Você define metas de R$/km e R$/h. O CalcMot compara a oferta com elas: ÓTIMA, BOA, MÉDIA ou RUIM. É uma estimativa, não uma garantia de lucro.',
      },
      {
        question: 'O que acontece fora dos apps de motorista?',
        answer: 'Ele fica em espera.',
      },
      {
        question: 'O histórico financeiro é obrigatório?',
        answer: 'Não. É opcional e fica neste aparelho.',
      },
      {
        question: 'O CalcMot garante que uma corrida dá lucro?',
        answer:
          'Não. Ele mostra uma estimativa com os dados disponíveis e a sua meta. Trânsito, custos e retorno vazio podem mudar o resultado.',
      },
      {
        question: 'Posso parar o CalcMot?',
        answer: 'Sim. Você pode pausar o serviço quando quiser.',
      },
    ],
  },
  finalCta: {
    title: 'Baixe antes do próximo turno.',
    description: 'Veja R$/km e R$/h antes de aceitar a próxima corrida.',
    button: 'Baixar na Play Store',
  },
} as const;
