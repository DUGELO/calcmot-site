import { BRAND_TOKENS } from '../../constants/brand.tokens';
import type { PageCopy } from './page-copy.types';

/**
 * Every number here can be recalculated by the reader:
 * R$ 18 ÷ 12 km = R$ 1,50/km · 24 min = 0,4 h → R$ 45/h
 * R$ 30 ÷ 21 km = R$ 1,43/km · 55 min ≈ 0,92 h → R$ 33/h
 * R$ 14 ÷ 4,8 km = R$ 2,92/km · 12 min = 0,2 h → R$ 70/h
 */
export const CALCULADORA_COPY: PageCopy = {
  meta: {
    path: '/calculadora-ganhos-motorista-app',
    title: 'Calculadora de ganhos do motorista de app: R$/km e R$/h — CalcMot',
    description:
      'Como calcular se uma corrida compensa: R$/km, R$/h, tempo até o passageiro, custo por km e sua meta. Com exemplos que você pode conferir.',
  },
  hero: {
    eyebrow: 'Calculadora de ganhos',
    title: 'Como saber se a corrida compensa antes de aceitar',
    lead: 'O valor total não responde sozinho. Duas contas resolvem: quanto entra por quilômetro rodado e quanto entra por hora de trabalho. Dá para fazer de cabeça com o que a oferta já mostra.',
    points: ['R$/km', 'R$/h', 'Custo por km', 'Sua meta'],
  },
  sections: [
    {
      id: 'duas-contas',
      eyebrow: 'Base da conta',
      title: 'Duas contas antes de aceitar',
      paragraphs: [
        'Antes de aceitar, importa menos o valor total e mais quanto entra por quilômetro e por hora de trabalho.',
        'As duas contas usam os dados que a oferta já mostra: valor, distância e tempo.',
      ],
      formulas: [
        {
          label: 'R$/km',
          expression: 'valor da corrida ÷ km totais',
          result: 'R$ 18 ÷ 12 km = R$ 1,50/km',
          note: 'Some a distância até o passageiro.',
        },
        {
          label: 'R$/h',
          expression: 'valor da corrida ÷ tempo total em horas',
          result: 'R$ 18 ÷ 0,4 h = R$ 45/h',
          note: '24 minutos viram 0,4 hora.',
        },
      ],
      note: 'O app não decide: ele mostra os números e a classificação. A decisão continua sua.',
    },
    {
      id: 'deslocamento',
      eyebrow: 'O erro mais comum',
      title: 'Inclua o tempo e a distância até o passageiro',
      paragraphs: [
        'O trecho até o passageiro consome combustível e minutos do seu turno, mas não aparece no valor da corrida.',
        'Quando a busca entra na conta, R$/km e R$/h caem. É por isso que a oferta grande nem sempre é a melhor.',
      ],
      bullets: ['Km totais = busca + viagem', 'Tempo total = busca + espera + viagem'],
    },
    {
      id: 'custo',
      eyebrow: 'Custo por km',
      title: 'Descubra quanto custa rodar 1 km',
      paragraphs: [
        'Combustível, manutenção, pneus, óleo e desgaste entram no custo por quilômetro. Esse número é seu, não do app.',
        'Com o custo por km você enxerga a margem estimada da corrida.',
      ],
      formulas: [
        {
          label: 'Margem estimada por km',
          expression: 'R$/km − custo por km',
          result: 'R$ 1,50 − R$ 0,55 = R$ 0,95/km',
          note: 'Estimativa com os seus custos.',
        },
      ],
      note: 'Custos variam por carro, combustível e cidade. Use os seus números, não uma média de internet.',
    },
    {
      id: 'limiares',
      eyebrow: 'Sua meta',
      title: 'Compare com as metas que você definiu',
      paragraphs: [
        'O CalcMot faz essa conta na hora da oferta e sinaliza o resultado: ÓTIMA, BOA, MÉDIA ou RUIM.',
      ],
      note: 'Na hora da oferta a classificação usa as metas que você definiu. Nos exemplos desta página, a meta é R$ 1,50 por km e R$ 35 por hora.',
    },
    {
      id: 'exemplo',
      eyebrow: 'Exemplo com duas ofertas',
      title: 'Mais no total pode ser menos por hora',
      paragraphs: [
        'A oferta que paga mais no total pode render menos por hora. Confira os dois casos com a meta de R$ 1,50/km e R$ 35/h.',
      ],
      formulas: [
        {
          label: 'Oferta A · R$ 30 · 21 km · 55 min',
          expression: 'R$ 30 ÷ 21 km = R$ 1,43/km · R$ 30 ÷ 0,92 h = R$ 33/h',
          result: 'RUIM',
          note: 'Abaixo das duas metas.',
        },
        {
          label: 'Oferta B · R$ 14 · 4,8 km · 12 min',
          expression: 'R$ 14 ÷ 4,8 km = R$ 2,92/km · R$ 14 ÷ 0,2 h = R$ 70/h',
          result: 'ÓTIMA',
          note: 'Muito acima das metas.',
        },
      ],
      note: 'Exemplos visuais para explicar a lógica. Não representam promessa de ganho.',
    },
    {
      id: 'erros',
      eyebrow: 'Erros comuns',
      title: 'Seis coisas que mudam o resultado',
      cards: [
        { title: 'Olhar só o valor total', detail: 'R$ 30 pode render menos por hora do que R$ 14.' },
        { title: 'Esquecer o trecho até o passageiro', detail: 'Km e minutos de busca entram na conta.' },
        { title: 'Ignorar o tempo parado', detail: 'Espera e trânsito consomem o seu turno.' },
        { title: 'Não contar o custo por km', detail: 'Sem esse número, o valor bruto engana.' },
        {
          title: 'Comparar corridas de tamanhos diferentes',
          detail: 'R$/km e R$/h colocam as duas na mesma régua.',
        },
        {
          title: 'Decidir com pressa e não revisar',
          detail: 'Corrija no extrato e você aprende com o seu próprio histórico.',
        },
      ],
    },
    {
      id: 'limites',
      eyebrow: 'Limites da conta',
      title: 'O que a conta não vê',
      bullets: [
        'Congestionamento e tempo real de trânsito',
        'Tarifa dinâmica e promoções do app de corrida',
        'Volta vazia depois de deixar o passageiro',
        'Custos que mudam com o preço do combustível',
      ],
      note: 'Por isso a classificação é uma estimativa. Ela ajuda a decidir, mas não substitui o seu julgamento.',
      image: {
        src: BRAND_TOKENS.assets.overlayLive,
        alt: 'Captura real de uma oferta em um app de corrida com o aviso do CalcMot mostrando a classificação BOA, R$ 2,01 por km, R$ 47,31 por hora e 13 minutos.',
        caption: 'Captura real de uma oferta analisada na hora.',
        width: 720,
        height: 600,
      },
    },
  ],
  closing: {
    title: 'Faça essa conta em dois segundos.',
    description: 'O CalcMot mostra R$/km, R$/h e a classificação antes de você aceitar.',
  },
};
