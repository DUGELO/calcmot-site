# Medição de aquisição e conversões — CalcMot Web

## Perguntas que este tracking responde

1. **Que páginas e canais trazem visitantes à calculadora?** Em GA4, use `web_calculator_viewed` com dimensão `source_page` e `entry_type` e cruze com *Session source / medium* e *Landing page* do próprio GA4. O evento não envia referrers nem UTMs em parâmetros personalizados.
2. **Qual link encaminha usuários à calculadora?** `web_calculator_link_clicked`, com `source_page` e `link_placement`. O clique é a intenção de navegar, não uma visita concluída.
3. **Onde a Play Store recebe cliques?** `web_play_store_clicked`, com `source_page` e `link_placement`. Compare `header_cta`, `home_hero_cta`, `calculator_result`, `calculator_real_offer`, `footer_play` e `cta_band`.

## Eventos novos e parâmetros

| Evento | Momento | Parâmetros |
|---|---|---|
| `web_calculator_link_clicked` | Clique confiável em link interno para a ferramenta | `source_page`, `link_placement`, `destination=ride_calculator` |
| `web_calculator_viewed` | Inicialização da ferramenta no domínio de produção; uma vez por carregamento | `source_page`, `link_placement`, `entry_type`, `destination=ride_calculator` |
| `web_play_store_clicked` | Clique confiável em link para a listagem oficial do CalcMot na Play Store | `source_page`, `link_placement`, `destination=play_store` |

`source_page`: home, ride_calculator, app_calculator, how_it_works, privacy, support, other_internal, external, direct. `entry_type`: internal, external, direct. `link_placement`: valores fixos validados pelo helper, ou other_link. Para navegação entre páginas, o navegador preserva temporariamente a categoria em sessionStorage (máximo de 2 minutos), removida ao registrar entrada. Quando não há ponte válida, utiliza classe do referrer (interno, externo, sem referência).

## Implementação e governança
- O rastreamento é centralizado no `SiteAnalyticsService`; um listener delegado evita instrumentação duplicada em componentes. Os rótulos de posição são adicionados via `data-analytics-placement`.
- O GA4 continua sendo dono automático de `page_view`. **Não** disparar um segundo page_view.
- Eventos legados `web_play_clicked`, `web_tool_completed`, `web_tool_first_completed` são mantidos. **Não somar** cliques legados e novos como conversões distintas; o novo evento é o padrão para comparação de posicionamentos.
- `web_play_store_clicked` mede **clique de saída, não instalação**. Não inferir instalações da Play Store nem deduzir que 34 sessões com outbound click foram instalações.
- Sem payload de custo, distância, duração, consultas, IDs, valores ou referrer completo. Análise por `source_page` tem cardinalidade baixa.
- Eventos só são enviados nos hosts de produção existentes na configuração; no preview não há coleta. Consentimento segue a configuração já existente — esta alteração não modifica a política de cookies.
- Clarity continua medindo comportamento e sessões. A atribuição detalhada por destino deve ser consultada no GA4, que recebe os eventos novos; Clarity não oferece esta segmentação apenas com os dados agregados previamente exportados.

## Configuração GA4 após publicação
1. Admin > Definições personalizadas: criar dimensões de escopo **Evento** para `source_page`, `link_placement`, `entry_type` (sem recriar se já existirem). Pode haver defasagem até surgirem nas explorações.
2. Em Explorar > Forma livre, filtrar `event_name` pelos três eventos novos; dimensões `Event name`, `source_page`, `link_placement`, `Session source / medium`, `Device category`; métrica `Event count` e `Total users`.
3. Criar funil de exploração: `web_calculator_viewed` -> `web_tool_first_completed` -> `web_play_store_clicked` com `source_page=ride_calculator` para a última etapa. Analisar por sessões/usuários e período sem interpretar totais de eventos como pessoas únicas.
4. Consultar links por `link_placement` e comparar a origem e taxa de primeiro cálculo após 14–28 dias, reportando contagens antes de qualquer inferência de variação.

## QA
`npm run test:analytics` testa normalização de barras finais, destinos permitidos, origem categórica, não vazamento de URL, posicionamento validado e expiração da ponte. GitHub CI também valida QA estático, motor financeiro, build Angular e prerender. Sem merge automático.
