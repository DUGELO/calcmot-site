import { BRAND_TOKENS } from '../../constants/brand.tokens';
import type { PageCopy } from './page-copy.types';

export const PRIVACIDADE_COPY: PageCopy = {
  meta: {
    path: '/privacidade',
    title: 'Privacidade: o que o CalcMot lê e o que ele não faz — CalcMot',
    description:
      'Permissão de acessibilidade, leitura processada no aparelho, sem endereços, sem prints e sem texto bruto. Veja o que o CalcMot guarda e como pausar.',
  },
  hero: {
    eyebrow: 'Privacidade e controle',
    title: 'O que o CalcMot lê, o que ele guarda e o que ele não faz',
    lead: 'O CalcMot existe para reduzir carga visual na hora da oferta. Para isso, ele lê o que já está visível na tela — e nada além disso.',
    points: ['Leitura no aparelho', 'Sem endereços', 'Sem prints', 'Sem texto bruto'],
  },
  sections: [
    {
      id: 'resumo',
      title: 'Em três linhas',
      paragraphs: [
        'Se você leu só esta parte, já entendeu o essencial.',
      ],
      cards: [
        {
          title: 'Lê o que está visível',
          detail: 'Valor, distância e tempo da oferta exibida na tela. Só isso.',
        },
        {
          title: 'Processa no aparelho',
          detail: 'A leitura visual acontece no próprio celular. As imagens não são salvas nem enviadas.',
        },
        {
          title: 'Não guarda prints nem endereços',
          detail: 'O extrato registra o que você confirmou ou corrigiu.',
        },
      ],
    },
    {
      id: 'acessibilidade',
      eyebrow: 'Permissão',
      title: 'A permissão de acessibilidade e o que ela permite',
      paragraphs: [
        'A oferta fica na tela por poucos segundos. O serviço de acessibilidade é o que permite ler essa oferta e reorganizar os dados em um aviso simples.',
        'A permissão é concedida por você nas configurações do Android e pode ser desligada a qualquer momento.',
      ],
      bullets: [
        'Lê valor, distância e tempo visíveis na oferta',
        'Mostra o aviso com a sua meta de R$/km e R$/h',
        'Não toca na tela, não digita e não clica por você',
      ],
      note: 'Sem a permissão, o app não consegue ler a oferta.',
      image: {
        src: BRAND_TOKENS.assets.settings,
        alt: 'Configurações do CalcMot mostrando o card de permissão de acessibilidade como ativado, com explicação de uso e atalho para a tela do sistema.',
        caption: 'Configurações do app: acesso e permissão.',
      },
    },
    {
      id: 'dados',
      eyebrow: 'Dados',
      title: 'O que é coletado e o que é compartilhado',
      paragraphs: [
        'A declaração de segurança de dados da ficha do app na Play Store informa: nenhum dado coletado e nenhum dado compartilhado com terceiros.',
        'Este site não tem formulário, não tem login e não pede dados pessoais para você ler ou baixar o app.',
      ],
      note: 'A ficha do app na Play Store é onde aparece a declaração de dados da versão publicada.',
    },
    {
      id: 'leitura',
      eyebrow: 'Leitura da tela',
      title: 'Prints, imagens e texto bruto',
      paragraphs: [
        'Em apps compatíveis, quando as informações da oferta não estão disponíveis de forma acessível, o app pode usar leitura visual local no próprio aparelho para identificar valor, tempo e distância.',
        'Essa leitura é processada no dispositivo. As imagens não são salvas nem enviadas para servidores.',
      ],
      bullets: [
        'Processamento no aparelho',
        'Nenhum print armazenado',
        'Nenhum texto bruto guardado',
        'Nada enviado para servidores',
      ],
      note: 'O histórico do CalcMot registra dados confirmados ou corrigidos por você, sem guardar endereços, prints ou texto bruto.',
    },
    {
      id: 'historico',
      eyebrow: 'Histórico',
      title: 'Histórico e extrato',
      paragraphs: [
        'O histórico é opcional e fica neste aparelho. Ele serve para você comparar turnos, não para outra pessoa analisar a sua rotina.',
        'Como em qualquer app Android, limpar os dados do app ou desinstalar remove o que está guardado no aparelho.',
      ],
      bullets: ['Histórico opcional', 'Dados confirmados por você', 'Sem endereços, prints ou texto bruto'],
    },
    {
      id: 'controle',
      eyebrow: 'Controle',
      title: 'Você pode pausar quando quiser',
      paragraphs: [
        'O cálculo automático pode ser desligado nas configurações. Fora dos apps de motorista compatíveis, o CalcMot fica em espera.',
        'Se a leitura travar, "Reiniciar leitura" e "Diagnóstico de leitura" recuperam o funcionamento.',
      ],
    },
  ],
  closing: {
    title: 'Privacidade também é saber pausar.',
    description: 'Baixe o CalcMot e desligue o cálculo automático quando quiser.',
  },
};
