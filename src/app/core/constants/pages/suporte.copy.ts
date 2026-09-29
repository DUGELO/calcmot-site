import type { PageCopy } from './page-copy.types';

export const SUPORTE_COPY: PageCopy = {
  meta: {
    path: '/suporte',
    title: 'Suporte e diagnóstico — CalcMot',
    description:
      'O aviso não aparece, a leitura travou ou a permissão caiu? Veja os quatro passos, as dúvidas frequentes e onde o CalcMot funciona.',
  },
  hero: {
    eyebrow: 'Suporte',
    title: 'Algo não funcionou? Comece por aqui.',
    lead: 'Quatro passos resolvem a maior parte dos problemas de leitura. Se não resolver, veja o diagnóstico de leitura e o canal de suporte.',
    points: ['4 passos', 'Dúvidas frequentes', 'Requisitos'],
  },
  sections: [
    {
      id: 'passos',
      eyebrow: 'Antes de escrever',
      title: 'Os quatro passos de sempre',
      steps: [
        {
          number: '1',
          title: 'Confirme o cálculo automático',
          detail: 'Em Configurações, o interruptor do cálculo automático precisa estar ligado.',
        },
        {
          number: '2',
          title: 'Veja a permissão de acessibilidade',
          detail: 'O card de acesso precisa aparecer como ativado.',
        },
        {
          number: '3',
          title: 'Use "Reiniciar leitura"',
          detail: 'Serve para recuperar a leitura quando ela trava.',
        },
        {
          number: '4',
          title: 'Abra o app de corrida e deixe a oferta na tela',
          detail: 'Fora dos apps de motorista compatíveis, o CalcMot fica em espera.',
        },
      ],
      note: 'Nada disso resolveu? Abra "Diagnóstico de leitura" nas configurações: ele mostra o status técnico e a recuperação da leitura.',
    },
    {
      id: 'problemas',
      eyebrow: 'Problemas comuns',
      title: 'Três situações e o que fazer',
      cards: [
        {
          title: 'O aviso não aparece',
          detail:
            'Confira o cálculo automático ligado e a permissão de acessibilidade ativada. Depois abra o app de corrida e espere a oferta.',
        },
        {
          title: 'A leitura ficou instável',
          detail: 'Use "Reiniciar leitura". Se voltar a travar, abra o "Diagnóstico de leitura".',
        },
        {
          title: 'O aviso atrapalha a visualização',
          detail:
            'Nas configurações você muda a posição do aviso e o tema. O estilo contornado deixa o aviso mais discreto.',
        },
      ],
      image: {
        src: '/assets/screenshots/app-settings.jpg',
        alt: 'Configurações do CalcMot com cálculo automático ligado, mostrar impacto na meta, posição do aviso no topo, tema contornado, permissão de acessibilidade ativada e o diagnóstico de leitura.',
        caption: 'As configurações que resolvem a maioria dos casos.',
      },
    },
    {
      id: 'requisitos',
      eyebrow: 'Requisitos',
      title: 'Onde o CalcMot funciona hoje',
      bullets: [
        'Android',
        'Apps de motorista compatíveis, como Uber e 99',
        'Cálculo automático com a permissão de acessibilidade ativada',
      ],
      note: 'A tela de relatórios mostra o que está em estudo: inDrive, entregas e corridas particulares.',
    },
    {
      id: 'planos',
      eyebrow: 'Recursos',
      title: 'O que é gratuito e o que é Premium',
      paragraphs: [
        'A tela de relatórios marca cada recurso. O relatório do dia está disponível e a exportação diária é gratuita; o relatório semanal e mensal aparece marcado como Premium.',
      ],
      note: 'Os detalhes de versão e de assinatura ficam na ficha do app na Play Store e dentro do próprio app.',
    },
  ],
  faq: {
    title: 'Dúvidas frequentes',
    items: [
      {
        question: 'O CalcMot aceita ou recusa corrida por mim?',
        answer: 'Não. Ele mostra os números. Aceitar ou recusar continua sendo com você.',
      },
      {
        question: 'O que eu preciso ativar para usar?',
        answer:
          'A permissão de acessibilidade e o cálculo automático. Sem a permissão, o app não consegue ler a oferta.',
      },
      {
        question: 'O CalcMot funciona no iPhone?',
        answer: 'Hoje o CalcMot é um app para Android.',
      },
      {
        question: 'O aviso mostra o endereço do passageiro?',
        answer:
          'Não. O aviso mostra os números da oferta: classificação, R$/km, R$/h e tempo. O app não guarda endereços, prints nem texto bruto.',
      },
      {
        question: 'A classificação é a mesma para todo mundo?',
        answer:
          'Não. Ela usa as metas que você definiu. Se a sua meta muda, a classificação da mesma oferta muda junto.',
      },
      {
        question: 'Consigo mudar a minha meta?',
        answer: 'Sim. A meta por km e por hora fica nas configurações do app.',
      },
      {
        question: 'O aviso funciona em qualquer app de corrida?',
        answer: 'Só nos apps de motorista compatíveis. Fora deles, o CalcMot fica em espera.',
      },
      {
        question: 'Preciso deixar o app aberto?',
        answer:
          'O aviso é feito para aparecer durante a oferta com o cálculo automático ligado. Fora dos apps compatíveis, o app fica em espera.',
      },
    ],
  },
  closing: {
    title: 'Não encontrou a resposta?',
    description: 'As dúvidas de suporte são atendidas pelo canal divulgado na ficha do app na Play Store.',
  },
};
