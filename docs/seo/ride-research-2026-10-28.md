# CalcMot: pesquisa SEO e experiência do motorista

Pesquisa em 28/10/2026. Escopo: página existente `/ferramentas/corrida-vale-a-pena/`, descoberta interna e análise contextual Gemini. Não foram consultados Search Console, planejador de palavras-chave ou dados de concorrentes autenticados. As intenções abaixo são hipóteses editoriais fundamentadas na pesquisa, não estimativas de volume ou garantia de posição.

## O que orienta a entrega

O Google recomenda resolver a necessidade da pessoa com conteúdo original, evidências e boa experiência, inclusive em calculadoras. A página combina fórmulas verificáveis, exemplos próprios e referências oficiais, mantendo a análise pessoal fora do conteúdo indexável. Não criamos páginas repetidas por cidade, listas artificiais de palavras-chave ou avaliações inventadas.

Para aparecer em recursos de IA do Google, continuam valendo os fundamentos de SEO. Não há um schema especial que garanta inclusão. A página preserva HTML prerenderizado, canonical, título, descrição, links rastreáveis e WebApplication. Acrescentamos BreadcrumbList coerente com a navegação visível. Não prometemos FAQ rich results: a elegibilidade anunciada pelo Google é restrita a sites governamentais/de saúde reconhecidos.

Referências: [conteúdo útil](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), [recursos de IA](https://developers.google.com/search/docs/appearance/ai-features), [políticas antispam](https://developers.google.com/search/docs/essentials/spam-policies), [experiência da página](https://developers.google.com/search/docs/appearance/page-experience), [FAQ rich results](https://developers.google.com/search/blog/2023/08/howto-faq-changes).

## Referências úteis para o dia a dia

| Referência | O que a fonte oferece | Aplicação no CalcMot |
|---|---|---|
| [ANP — preços](https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos) | Levantamentos e análises oficiais de combustíveis | Link contextual; preço do recibo e consumo real continuam sendo os dados do motorista. |
| [Uber — ganhos e despesas](https://www.uber.com/br/pt-br/drive/how-much-drivers-make/) | Explica fatores que variam o ganho e despesas de dirigir | Separar oferta/receita de custos e conferir o app. |
| [99 — calculadora de ganhos](https://99app.com/ajuda/motorista/o-que-e-a-calculadora-de-ganhos/) | Explica estimativa semanal por cidade/horas e suas limitações | Diferenciar planejamento semanal de avaliação de uma oferta. |
| [GigU](https://gigu.app/br) | Posiciona cálculo de custos e análise de ofertas | Referência comercial de necessidade; não foi feita auditoria do aplicativo. |
| [StopClub](https://site.stopclub.com.br/) | Apresenta cálculo de ganhos e serviços ao motorista | Referência comercial; não há teste comparativo que sustente um ranking de “melhores”. |

As referências comerciais foram analisadas pelo conteúdo público de seus próprios sites. Não copiamos textos, preços, percentuais ou promessas de ganhos. O diferencial implementado é uma ferramenta web sem cadastro com conta explícita e contexto opcional, complementando a experiência do aplicativo CalcMot. Não há vínculo ou endosso dessas fontes.

## Mapa de intenções e respostas

| Busca/necessidade | Resposta na página | Uso da ferramenta |
|---|---|---|
| calculadora corrida Uber e 99 vale a pena | H1, cálculo e metodologia | Valor, distância e tempo; inclui busca opcional. |
| como calcular valor por km de uma corrida | Fórmula e indicadores R$/km/R$/h | Cálculo local, sem IA obrigatória. |
| como calcular custo por km do carro para Uber | `#custo-por-km`, combustível e custo total | Não confundir gasto de combustível com custo completo. |
| gasolina por km para motorista de aplicativo | Exemplo preço do litro ÷ consumo | Exemplo R$ 6/l e 12 km/l = R$ 0,50/km, sem preço de mercado presumido. |
| corrida curta ou longa qual compensa | `#curta-ou-longa`, comparação numérica | R$ 12/4 km/15 min versus R$ 40/20 km/60 min, antes dos custos. |
| corrida com retorno vazio vale a pena | Exemplo de volta e objetivo de IA | Contexto de retorno explicitamente confirmado ou hipotético. |
| corrida aeroporto espera estacionamento volta vazia | Seção específica, sem demanda inventada | Atalho de contexto “Espera e aeroporto”. |
| Uber com carro alugado como calcular custo | Rateio do mesmo período, sem duplicação | Atalho de contexto “Carro alugado”. |
| quanto cobrar corrida particular por km | `#corrida-particular`, equilíbrio e remuneração | Objetivo “Orçar um serviço particular”. |
| quanto sobra por hora depois dos custos | Metodologia e diferença entre receita/saldo/lucro | Objetivo de meta horária, sem meta universal. |

Uma página atende intenções relacionadas da mesma tarefa. Não expandir para aluguel por cidade, valores de aeroportos ou tabelas “2026” sem dados verificáveis e manutenção editorial. Datas indicam revisão real desta entrega, não atualização automática para parecer recente.

## UX e Gemini

- Perguntas expansíveis para custos, comparação e particular, após a calculadora. Breadcrumb visível e equivalente no JSON-LD. A revisão mobile removeu o bloco de atalhos do topo para chegar aos campos mais rápido.
- Campos numéricos preservados e ações por toque. Usar a ferramenta com o veículo parado.
- Objetivo de análise em select nativo; três atalhos acrescentam contexto editável sem inventar números nem substituir o texto existente.
- Resumo e próximo passo em primeiro plano. A conta e as dicas ficam em details acessível por teclado e toque, evitando uma resposta extensa ocupar a tela toda.
- Anúncio de leitor de tela restrito ao resumo. Contexto privado mascarado na instrumentação existente; nenhum texto enviado como dimensão/evento.
- Uma resposta válida desabilita repetição sem alteração de dados. Editar número, objetivo ou contexto reabilita a análise. Não há armazenamento local de prompts, histórico público nem chamadas automáticas de IA.
- Objetivo validado por enum no servidor. Prompt distingue aeroporto, aluguel, metas brutas/líquidas, corrida de aplicativo e serviço particular. O Gemini não consulta mapas, demanda ou fontes externas em tempo real.

Referências de interação e desempenho: [W3C — tamanho de alvos](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [Web Vitals](https://web.dev/articles/vitals). Testes de laboratório e Lighthouse não substituem métricas reais de usuários.

## Como acompanhar resultado

No Search Console, comparar períodos equivalentes antes/depois da publicação por página, consultas, dispositivo e país: impressões, cliques, CTR e posição média. Agrupar as consultas pelos temas acima e procurar consultas emergentes antes de criar conteúdo novo. Conferir indexação, canonical escolhido e sitemap. Não é necessário inserir termos na meta keywords.

Usar os eventos existentes de início/conclusão da ferramenta e clique na Play Store para observar uso e descoberta do produto; crescimento orgânico só pode ser afirmado com dados posteriores. Não divulgar percentual de aumento, volume de buscas ou prazo garantido sem medição. Revisar conteúdo quando fórmulas, produto ou fontes mudarem; evitar alterar todas as datas do sitemap em todo build.

## Entrega e continuidade

### Revisão mobile e movimento — 29/10/2026

A primeira proposta ainda exigia leitura demais. A versão revisada começa com três campos vazios e perguntas diretas: quanto recebe, km e minutos. A busca e os gastos ficam em abertura opcional. O resultado não ocupa espaço no celular antes do cálculo; depois mostra valores antes dos gastos, total da busca e uma ação para incluir gastos. A ajuda por IA também é opcional. Textos e enumerações técnicas foram trocados por linguagem de motorista; explicações de SEO ficam em perguntas expansíveis com todo o conteúdo no HTML prerenderizado. O H1 visível é “Essa corrida vale a pena?”, mantendo Uber/99 no texto e no título da busca.

Estados: exemplo preenchido, campos com erro, cálculo pronto, IA aguardando, espera prolongada após oito segundos, cancelamento e erro recuperável. Não há barra com percentual inventado nem celebração que classifique uma oferta sem dados. O próximo passo aparece antes dos detalhes da resposta. O prompt limita a resposta a 300 palavras e pede linguagem comum.

Movimento com propósito: transições de 160 ms nos controles e entrada de 240 ms por opacidade/deslocamento de 6 px; spinner apenas durante requisição. Efeitos só existem em `prefers-reduced-motion: no-preference`. Não há shake de erro, contagem animada de dinheiro, autoplay ou movimento no scroll. Cancelar a IA preserva os números e descarta resposta tardia.

Referências: [NN/g — propósito da animação](https://www.nngroup.com/articles/animation-purpose-ux/), [W3C — movimento por preferência do usuário](https://www.w3.org/WAI/WCAG22/Techniques/css/C39), [Chrome — opacity e transform](https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/motion). As escolhas visam orientar e reduzir incerteza; não foi feito estudo que demonstre mudança emocional nos usuários.

Este PR também versiona a análise CalcMot/Gemini e o compartilhamento nativo já publicados manualmente na sessão anterior, para evitar que o próximo deploy Git remova a feature. Chaves não entram no Git. Alterações preexistentes de documentos administrativos e dependências ficam fora do commit desta entrega. O deploy mantém o ambiente administrativo PROD já publicado, sem modificar rotas ou dados do gateway.
