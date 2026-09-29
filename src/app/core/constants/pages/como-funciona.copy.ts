import { BRAND_TOKENS } from '../../constants/brand.tokens';
import type { PageCopy } from './page-copy.types';

export const COMO_FUNCIONA_COPY: PageCopy = {
  meta: {
    path: '/como-funciona',
    title: 'Como o CalcMot lê a oferta antes de você decidir — CalcMot',
    description:
      'Permissão de acessibilidade, aviso flutuante, o que é estimado, o que o app não faz e como pausar. Entenda o CalcMot antes de baixar.',
  },
  hero: {
    eyebrow: 'Como funciona',
    title: 'O CalcMot lê a oferta e mostra a conta. Quem decide é você.',
    lead: 'Ele não toca na tela e não mexe no app de corrida. O trabalho dele é ler o que já está visível para você e transformar valor, distância e tempo em R$/km, R$/h e uma classificação.',
    points: [
      'Leitura do que está na tela',
      'Cálculo com a sua meta',
      'Nenhuma ação no app de corrida',
    ],
  },
  sections: [
    {
      id: 'acessibilidade',
      eyebrow: 'Permissão',
      title: 'Por que o CalcMot usa acessibilidade',
      paragraphs: [
        'A oferta fica na tela por poucos segundos. Você precisa ler valor, distância e tempo ao mesmo tempo e ainda decidir. É essa pressa que a leitura do CalcMot resolve.',
        'A permissão de acessibilidade é o que permite ler o que já está visível para você. O CalcMot não toca na tela, não envia comandos e não altera nada nos outros aplicativos.',
      ],
      bullets: [
        'Lê valor, distância e tempo da oferta visível',
        'Compara com a sua meta de R$/km e R$/h',
        'Processa a leitura no próprio aparelho',
      ],
      note: 'As imagens usadas na leitura não são salvas nem enviadas para servidores.',
      image: {
        src: BRAND_TOKENS.assets.settings,
        alt: 'Configurações do CalcMot com a permissão de acessibilidade marcada como ativada e o cálculo automático ligado.',
        caption: 'Configurações do app: permissão de acessibilidade ativada.',
      },
    },
    {
      id: 'aviso',
      eyebrow: 'Aviso flutuante',
      title: 'O que aparece no aviso',
      paragraphs: [
        'O aviso entra por cima da oferta, com o essencial: a classificação, o significado em palavras e os números que decidem a corrida.',
      ],
      bullets: [
        'Classificação: ÓTIMA, BOA, MÉDIA ou RUIM',
        'Significado: muito acima da meta, dentro da meta, no limite ou abaixo da meta',
        'R$/km e R$/h com o tempo total',
        'Impacto na meta, quando essa opção está ligada',
      ],
      note: 'Você escolhe onde o aviso aparece na tela e o estilo visual dele.',
      example: {
        status: 'ÓTIMA',
        meaning: 'Muito acima da meta',
        perKm: 'R$ 2,41/km',
        perHour: 'R$ 48/h',
        minutes: '18 min',
        tone: 'great',
        note: 'exemplo visual',
      },
    },
    {
      id: 'estimado',
      eyebrow: 'Estimado e confirmado',
      title: 'O que é estimativa e o que é registro',
      paragraphs: [
        'A classificação é sempre uma estimativa: ela compara os dados visíveis da oferta com as metas que você definiu.',
        'Confirmado é o que entra no extrato depois, com dados que você confirmou ou corrigiu. O CalcMot não guarda endereços, prints nem texto bruto.',
      ],
      bullets: ['Estimado: leitura da oferta e classificação', 'Confirmado: o que você registra e corrige'],
    },
    {
      id: 'limites',
      eyebrow: 'Limites',
      title: 'O que o CalcMot não faz',
      bullets: [
        'Não toca na tela',
        'Não aceita corridas',
        'Não recusa corridas',
        'Não envia mensagens',
        'Não altera configurações do aparelho',
        'Não controla outros aplicativos',
      ],
      note: 'Fora dos apps de motorista compatíveis, o CalcMot fica em espera.',
    },
    {
      id: 'pausar',
      eyebrow: 'Controle',
      title: 'Como pausar ou reiniciar a leitura',
      paragraphs: [
        'Nas configurações existe o interruptor do cálculo automático. Desligue e o aviso para de aparecer.',
        'Se a leitura travar, use "Reiniciar leitura". Em "Diagnóstico de leitura" você vê o status técnico e o app se recupera.',
      ],
    },
    {
      id: 'apps',
      eyebrow: 'Android · Uber · 99',
      title: 'Onde ele funciona',
      paragraphs: [
        'O CalcMot é um app para Android e lê ofertas nos apps de motorista compatíveis.',
        'Fora desses apps, ele fica em espera: não fica lendo a tela sem motivo.',
      ],
      image: {
        src: BRAND_TOKENS.assets.overlayReal,
        alt: 'Captura real de uma oferta em um app de corrida com o aviso do CalcMot sobre a tela mostrando classificação, R$/km, R$/h e tempo.',
        caption: 'Captura real: aviso do CalcMot durante uma oferta.',
        width: 720,
        height: 600,
      },
      note: 'O CalcMot é uma ferramenta independente e não tem vínculo oficial com plataformas de transporte.',
    },
  ],
  closing: {
    title: 'Veja a diferença na próxima oferta.',
    description: 'Instale o CalcMot e confira R$/km, R$/h e a classificação antes de aceitar.',
  },
};
