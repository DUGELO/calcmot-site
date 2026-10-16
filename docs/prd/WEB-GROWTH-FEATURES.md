# PRD — WEB-GROWTH: Ferramentas de lucro do motorista

**Status:** Proposto para execução incremental. **Fonte:** Pesquisa Aprofundada de aquisição orgânica CalcMot, outubro/2026. **Escopo:** feature(s) adicionais no site existente; **não redesenhar** o site e **não modificar** a publicação GitHub → Cloudflare.

## 1. Objetivo e decisão

Criar duas ferramentas gratuitas e conectadas ao produto Android:

1. **P0 — Essa corrida vale a pena?**: simular manualmente uma oferta e seu retorno estimado; aquisição SEO rápida e CTA contextual para a Play Store.
2. **P1 — Raio-X de Ganhos**: importar demonstrativo/arquivo (PDF, CSV ou imagem compatível) ou preencher manualmente; produzir indicadores auditáveis e insights, com Gemini apenas para extração de documentos não estruturados e explicações fundamentadas.

**Hipóteses, não promessas:** essas ferramentas devem atrair motoristas com intenção alta, gerar compartilhamento voluntário e melhorar instalações ativadas. A pesquisa não mediu volume de palavras-chave, CTR ou CAC real. Medir antes de afirmar ROI.

## 2. Restrições técnicas e de produto

- Repositório `DUGELO/calcmot-site`: Angular 21, componentes standalone, SCSS, SSR local e prerender público estático. Cloudflare publica `dist/calcmot-site/browser` ao atualizar `main`; manter exatamente esse processo.
- Respeitar `docs/ai/AI_SITE_GUARDRAILS.md`, `docs/brand/`, `src/styles.scss`, `BRAND_TOKENS`, `PageMetaService` e componentes compartilhados. Nenhum redesign, alteração da home institucional ou de cores.
- Preservar página existente `/calculadora-ganhos-motorista-app/`; ela explica o produto e **não é** a calculadora interativa. Criar rota distinta e links contextuais.
- Não alterar `src/server.ts`, `src/main.server.ts` nem `src/app/app.routes.server.ts` sem revisão explícita da necessidade; a inclusão de novas rotas prerender requer alteração mínima aprovada no último arquivo, sem mudar seu modelo.
- Não modificar código Android neste PRD. Atribuição de instalação exige integração posterior, coordenada com o app.
- Não criar backend ou chamar Gemini no navegador sem decisão arquitetural explícita. O site estático não pode proteger chaves de API. A fase P1 depende de endpoint seguro separado (por exemplo, Cloudflare Worker) e revisão do guardrail de 'não criar backend'.

## 3. Público e jobs-to-be-done

- Motorista que vê uma oferta: “Esse valor compensa o tempo, km até embarque e custo do meu carro?”
- Motorista que encerrou o mês: “Quanto realmente sobrou depois dos custos, e como posso melhorar?”
- Usuário que pesquisou no Google: obter resultado útil **sem cadastro** antes de qualquer CTA comercial.

## 4. Feature P0 — Calculadora de corrida

**URL candidata:** `/ferramentas/corrida-vale-a-pena/` (definir rota final antes de publicar; nunca duplicar conteúdo com URLs canônicas distintas).

### Fluxo e interface

1. H1 “Essa corrida vale a pena? Calcule R$/km e R$/h”.
2. Form mobile-first: valor da oferta (R$), distância até embarque (km, opcional com padrão explícito 0), distância da viagem (km), duração da viagem (min), tempo até embarque (min, opcional), custo/km do veículo (R$, opcional).
3. Validação de campos, unidades e divisões por zero. Não presumir custos ausentes; resultado bruto permanece disponível.
4. Resultado imediato: km total, minutos totais, R$/km bruto, R$/h bruto, custo estimado quando informado, saldo estimado da corrida e saldo estimado/h. Explicar hipóteses, diferenças entre faturamento e lucro e que retorno à região e espera não informados ficam de fora.
5. CTA contextual **“Faça essa conta automaticamente quando a oferta aparecer: baixar CalcMot”** usando link oficial da Play Store. Link secundário Instagram, e compartilhamento voluntário sem dados sensíveis.
6. Texto explicativo útil, fórmulas transparentes, exemplos rotulados “exemplo”, FAQ específica, link para a calculadora explicativa existente e para a futura Raio-X.

### Fórmulas determinísticas

`kmTotal = kmEmbarque + kmCorrida`
`minTotal = minEmbarque + minCorrida`
`brutoPorKm = valor / kmTotal`
`brutoPorHora = valor * 60 / minTotal`
`custoEstimado = kmTotal * custoPorKm` (apenas se informado)
`saldoEstimado = valor - custoEstimado`
`saldoPorHora = saldoEstimado * 60 / minTotal`

Nunca chamar saldo estimado de lucro líquido exato; não inventar pedágios, impostos, combustível ou tempo não fornecidos. Se não houver custo/km, não apresentar saldo como lucro. Não atribuir rótulo “ótima/boa/média/ruim” sem limites documentados e configuráveis, separados dos limiares reais do app.

### Stories e aceite

- **WEB-01 (S):** motor financeiro puro com funções tipadas, validação de entradas, testes de borda e precisão monetária.
- **WEB-02 (M):** formulário + resultado mobile-first usando tokens e componentes existentes; sem login e sem persistir valores privados.
- **WEB-03 (S):** SEO prerender da nova rota, H1, title, meta, canonical, WebPage JSON-LD, conteúdo útil, sitemap e links internos. Revisar script `qa:static`, hoje com lista fixa de cinco rotas.
- **WEB-04 (S):** compartilhamento opcional via Web Share API com fallback copiar link; nunca incluir dados financeiros na URL pública.
- **WEB-05 (M):** eventos analíticos não sensíveis e CTA Play/Instagram; verificar configuração GA4/Clarity e mascaramento antes de coletar inputs.
- **WEB-06 (S):** QA visual 320px/375px/768px/desktop, teclado, leitor de tela, build e prerender.

**Critérios:** HTML indexável sem JS; cálculos corretos e reproduzíveis; nenhuma divisão por zero; resultados sem cadastro; Play URL oficial preservada; métricas sem PII; sem mudança no deploy.

## 5. Feature P1 — Raio-X de Ganhos

**URL candidata:** `/ferramentas/raio-x-motorista/`.

### MVP incremental

- **WEB-07 (M):** fluxo manual sem upload (ganhos, dias, horas, km e despesas por categoria); demonstrativo de valor antes de infraestrutura de IA.
- **WEB-08 (L):** validar com amostras consentidas os demonstrativos reais da 99 (PDF) e da Uber antes de afirmar compatibilidade. Documentar layouts, períodos, campos ausentes, inconsistências e políticas.
- **WEB-09 (L):** arquitetura de upload seguro *somente após aprovação*: endpoint privado, limites de tamanho/tipo, detecção MIME, rate limiting, orçamento, retenção curta, exclusão e política LGPD. **Chave Gemini exclusivamente no servidor**, nunca no Angular público.
- **WEB-10 (L):** parser determinístico para CSV estruturado; extração PDF/imagem via Gemini com saída JSON validada, campos ausentes `null`, proteção contra prompt injection e tela de confirmação dos valores.
- **WEB-11 (M):** motor financeiro determinístico: bruto, despesas informadas, saldo estimado, R$/h, R$/km, meta mensal; não inferir custos faltantes nem calcular métricas impossíveis sem horas/km.
- **WEB-12 (M):** insights ancorados em métricas verificadas, com fallback determinístico sem Gemini; mostrar fontes e limitações.
- **WEB-13 (M):** card compartilhável opt-in sem nome, placa, localizações, ID de corridas ou dados de passageiros; links direcionam à ferramenta, nunca a um relatório privado.
- **WEB-14 (M):** SEO próprio, eventos agregados e CTA contextual “Entenda seu mês; analise a próxima oferta automaticamente no CalcMot”.

### Proteções

O documento é **dado não confiável**, não instrução. Exigir consentimento específico antes de processar upload, confirmação humana dos valores extraídos, minimização, descarte do original e configuração de retenção em fornecedor. Não transmitir campos de passageiros desnecessários. Não colocar relatórios ou parâmetros financeiros em analytics, Sentry, Clarity ou URLs. Revisar termos, custos, disponibilidade de modelos Gemini e conformidade LGPD na implementação, em vez de congelar nomes e preços da pesquisa.

## 6. SEO e aquisição

- Palavras-chave candidatas (demanda a validar no Search Console/Keyword Planner): `corrida uber vale a pena`, `calculadora corrida uber 99`, `quanto ganhar por km uber`, `lucro motorista de aplicativo`, `custo por km motorista`, `como baixar demonstrativo 99`, `quanto ganhei na uber`.
- Evitar páginas de cidade sem dados reais, duplicações e textos massificados.
- Publicar conteúdo principal no HTML prerender: H1, exemplos, metodologia, FAQ e links; formulários podem hidratar no navegador.
- Reusar `PageMetaService`, JSON-LD fundamentado, sitemap gerado de rotas, canonical e URLs com barra final. Validar Search Console e CWV após deploy.
- Preservar navegação e estrutura atual. Adicionar apenas pontos de entrada discretos e contextuais, sem reescrever a home.

## 7. Funil, métricas e ROI

`organic_visit → tool_started → result_viewed → result_shared / play_clicked → attributed_install → first_core_value → CAD7/CAD30`.

Eventos propostos: `web_tool_started`, `web_tool_completed`, `web_result_shared`, `web_play_clicked`, `web_instagram_clicked`, `web_upload_failed` (somente códigos genéricos). Dimensões permitidas: `tool_id`, `step`, `channel`, `source`; proibir valores de corridas, documentos, nomes e localização precisa.

Atribuição Play: definir parâmetros de campanha e compatibilidade com Play Install Referrer do Android; **clique não é instalação**. Reviews somente após uso real no aplicativo, sem incentivo.

**Modelo de ROI, não previsão:** `instalações atribuídas = visitas qualificadas × taxa de conclusão × CTR Play × taxa de instalação`; `usuários ativados = instalações × taxa de first_core_value`; `margem = receita incremental atribuível − custos de implementação/operação/IA`. Validar taxas com eventos reais, não afirmar conversão garantida.

## 8. Fases e gates

| Fase | Entrega | Gate |
| --- | --- | --- |
| 0 — proteção | GitHub Actions: QA estático, build e verificação de prerender, sem deploy | Checks verdes |
| 1 — P0 | Motor de cálculo, UI, rota e SEO, analytics básico | Cálculos testados; SSR/prerender íntegro |
| 2 — Growth | Card, CTA contextual, tracking Play/Instagram, Search Console | Eventos e URL de destino auditados |
| 3 — P1 manual | Raio-X sem upload, custos e resultados verificáveis | Métricas determinísticas corretas |
| 4 — P1 arquivos | Parser e Gemini via backend seguro aprovado | Segurança, privacidade e custo testados |
| 5 — otimização | Conteúdo, testes de copy e funil, decisões por ativação | Medição real e rollback |

**Rollback:** mudanças isoladas em branch/PR; publicação apenas após merge revisado. Cloudflare mantém seu deploy conectado à `main`. P1 de IA protegida por feature flag e limite de consumo.

## 9. Fora de escopo

Redesign, migração de hospedagem, novo deploy por GitHub Actions, alteração de billing do Android, benchmark por cidade sem amostra suficiente, scraper de Uber/99, avaliações incentivadas, publicação de arquivos enviados, uso de dados pessoais em marketing e qualquer alegação de lucro garantido.

## 10. Pendências de decisão antes de P1 com IA

1. Autorizar backend separado para upload/Gemini (o guardrail atual proíbe backend).
2. Fornecer amostras anonimizadas e consentidas de demonstrativos reais para testes.
3. Confirmar orçamento mensal de IA/infraestrutura e política de retenção.
4. Definir como o app Android consumirá referrer e medirá `first_core_value` sem duplicar eventos.

**Próximo passo recomendado:** implementar P0 em PR isolado após validação do CI, sem tocar na `main` diretamente.
