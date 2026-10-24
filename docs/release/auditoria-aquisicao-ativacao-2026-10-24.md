# CalcMot — auditoria de aquisição, ativação e dimensões GA4

**Data da consulta:** 24/10/2026 (dia em andamento).
**Fontes autenticadas:** Windsor.ai → GA4 **Site CalcMot (557155341)** e GA4 **calcmot Android (549559204)**.
**Janelas:** 20 a 24/10/2026, com 24/10 parcial. Data e timestamps sujeitos à configuração de fuso das propriedades.
**Natureza:** relatório operacional observacional, não experimento. Não houve compra de anúncios nem intervenção na instrumentação publicada.

## 1. Site: resultado observado

| Métrica | Total 20–24/10 | Interpretação |
|---|---:|---|
| `web_play_store_clicked` | **19 eventos** | Cliques na listagem oficial, **não** instalações |
| `web_calculator_viewed` | **6 eventos** | Visitas rastreadas; não se deve inferir 6 indivíduos |
| `web_calculator_link_clicked` | **2 eventos** | Clique em link interno, não visita efetiva |
| `web_tool_first_completed` | **1 evento** | Primeira conclusão na instância da ferramenta, não um novo assinante |
| `web_tool_completed` | **1 evento** | Resultado válido, inclui possíveis testes |

**Cliques na Play Store por dia:** 20/10: 2; 21/10: 4; 22/10: 9; 23/10: 3; 24/10: 1.

**Por página de evento:** homepage `/` 17; calculadora `/ferramentas/corrida-vale-a-pena` 2.

**Por origem de sessão dos eventos de clique:** `chatgpt.com / ai-assistant` 17; `(direct) / (none)` 1; `ig / social` 1.

**Por dispositivo dos eventos de clique:** mobile 17; desktop 2.

O relatório detalhado identificou dois cliques mobile em outros contextos do site? **Não**: na dimensão `page_path`, 17 ficaram na home e 2 na calculadora. Não inferir posições do CTA apenas por `page_path`.

**Regra de interpretação:** os 17 cliques classificados como ChatGPT **não são automaticamente tráfego interno**; podem incluir visitantes externos e testes. Só excluir da avaliação de aquisição quando a sessão de teste for confirmada por evidência observável. Não alterar retroativamente dados do GA4, não bloquear o canal ChatGPT, não excluir IPs ou usuários por suposição. Comparações de canal devem apresentar cenário bruto e cenário *sem testes confirmados*, explicitando o método.

## 2. Aplicativo Android: primeira abertura e ativação operacional

| Data | `first_open` (usuários) | `overlay_shown` por usuários da coorte na data de primeira sessão | Ativação D0 indicativa |
|---|---:|---:|---:|
| 20/10 | 7 | 2 | 28,6% |
| 21/10 | 8 | 5 | 62,5% |
| 22/10 | 26 | 11 | 42,3% |
| 23/10 | 13 | 7 | 53,8% |
| 24/10* | 4 | 3 | 75,0% |
| **Total** | **58** | **28** | **48,3%** |

*24/10 é parcial; taxas diárias em coortes pequenas são voláteis.*

Definição provisória **ativação operacional D0**: usuário da coorte de primeira sessão com ao menos um `overlay_shown` no mesmo dia. A condição mede a funcionalidade central do app, não monetização, margem, satisfação ou consentimento. O denominador usa usuários com `first_open` e o numerador usuários com `overlay_shown` agrupados por `first_session_date`. Auditar diferenças eventuais de coorte antes de usar como KPI financeiro.

**Primeira origem de usuário nas 58 primeiras aberturas:** `google-play / organic`: 41; `(direct) / (none)`: 17. Não indica que 41 vieram de SEO do site; é atribuição dentro da propriedade do aplicativo.

**Coortes maduras, retorno funcional D7 (métrica específica, não D7 padrão do GA4):**
- Coorte 15/10: 14 usuários com `overlay_shown` em 22/10, de 67 `first_open` em 15/10 → **20,9%**.
- Coorte 16/10: 4 usuários com `overlay_shown` em 23/10, de 44 `first_open` em 16/10 → **9,1%**.

Estas taxas representam ação funcional no sétimo dia-calendário após a primeira sessão, não o número de usuários que abriram o app em qualquer momento da semana. Não comparar com benchmarks externos sem harmonizar definições.

**Limitação de aquisição:** `first_open` ≠ instalação medida pela Play Console; reinstalações, primeira abertura tardia e métodos de atribuição podem divergir. **Não** dividir 58 por 19 nem chamar isso de conversão do site. Falta consulta à Play Console (instalações atribuídas, países, campanhas, novas instalações elegíveis, desinstalações) e ligação verificável entre clique web e primeira abertura Android.

## 3. Dimensões personalizadas: configuração pendente no GA4

A aplicação já envia os parâmetros categóricos abaixo no GA4 Web. O conector Windsor.ai disponibiliza `event_name`, `page_path`, `session_source_medium` e `platform_device_category`, mas **não** disponibiliza `source_page`, `link_placement` e `entry_type` entre seus campos consultáveis. Não é prova definitiva de inexistência no painel: é apenas uma limitação do acesso atual.

Na propriedade **557155341**, registrar, com escopo **Evento**, se ainda ausentes:

| Nome de exibição | Event parameter | Escopo |
|---|---|---|
| Source page | `source_page` | Event |
| Link placement | `link_placement` | Event |
| Entry type | `entry_type` | Event |

**Método manual:** GA4 > Admin > Exibição de dados > Definições personalizadas > Criar dimensões personalizadas.

**Método repetível por API:** `node scripts/ga4-register-custom-dimensions.mjs --plan`; depois, com OAuth de administrador, `GA4_ADMIN_ACCESS_TOKEN=... node scripts/ga4-register-custom-dimensions.mjs --check` e finalmente `--apply`. O código lista antes de criar, não duplica parâmetros existentes e falha se o escopo for incompatível. Executar fora do CI, sem publicar tokens ou armazená-los no repositório. Requer permissão de Editor/Administrador e token `analytics.edit`.

Dados personalizados podem demorar **24–48 horas** para aparecer nas explorações depois de seu cadastro e coleta. **Nenhuma dimensão foi criada remotamente por esta auditoria.**

Referências oficiais:
- https://support.google.com/analytics/answer/14239696?hl=pt-BR
- https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1beta/properties.customDimensions
- https://developers.google.com/analytics/devguides/collection/ga4/event-parameters

## 4. Excluir tráfego de homologação sem apagar público verdadeiro

Criar um **registro de QA com consentimento** dos responsáveis pela homologação, contendo apenas dia/hora de início, página, dispositivo genérico, canal e ações executadas; evitar IP bruto, cookie, client_id e identificadores pessoais nos documentos do repositório.

Para análise histórica, marcar apenas sessões compatíveis com horários de testes **confirmados** e não concluir que todo tráfego de ChatGPT ou navegação desktop seja teste. Para próximos testes, preferir `debug_mode` em ambiente de teste ou marcação categórica `traffic_class=test` apenas em QA intencional, seguindo regras de privacidade e com validação do mecanismo; não alterar Consent Mode para mascarar coleta.

Relatar **tráfego bruto** e **tráfego qualificado após exclusões justificadas** lado a lado; manter contagem de testes e decisões de exclusão documentadas.

## 5. Próximo funil decisório

1. **Site:** sessões por `session_source_medium`, landing e dispositivo → `web_calculator_viewed` → `web_tool_first_completed` → `web_play_store_clicked`. Eventos agregados isolados **não** formam um funil por sessão.
2. **Loja:** aquisição por origem rastreada, instalações efetivas e abertura pela primeira vez segundo as definições de cada plataforma.
3. **App:** `first_open` → `overlay_shown` D0 → `overlay_shown` D1/D7, segmentado por coorte.
4. **Economia:** obter custos reais por campanha, pagantes, faturamento líquido e contribuição variável. Sem esses dados, CAC por pagante, payback e LTV/CAC são **não mensuráveis**.

**Proibição operacional:** não escalar mídia paga com base em cliques para a loja; não declarar crescimento ou retorno financeiro com base em tráfego potencialmente de homologação. Antes de investir, exigir coortes sem teste confirmado e mensuração de instalação/ativação.

## 6. Estado de execução em 24/10

- [x] Consultar dados autenticados do GA4 Web (557155341).
- [x] Consultar dados autenticados do GA4 Android (549559204).
- [x] Identificar volume e origem dos cliques específicos da Play Store.
- [x] Derivar primeira abertura, ativação D0 e D7 funcional exploratório por coortes.
- [x] Preparar rotina idempotente de cadastro das dimensões da propriedade Web.
- [ ] Listar/cadastrar dimensões diretamente na propriedade GA4 (exige OAuth Admin com escopo e função adequados).
- [ ] Obter Play Console para instalação atribuída e retenção de loja (sem conector conectado).
- [ ] Identificar concretamente sessões de QA e validar segmentação.
- [ ] Comparar `link_placement` por CTA (depende das dimensões estarem consultáveis).
- [ ] Comparar CAC e ativação atribuída (depende de Play Console e custos).

Não houve alteração de configuração do GA4, de consentimento, de eventos do app nem campanha paga.
