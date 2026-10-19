# Auditoria mobile-first CalcMot — 19/10/2026

## Fontes observadas
- Clarity Web (não app): 114 sessões, 71 mobile (62,28%), 9 sessões com cliques inativos. Heatmap específico da calculadora: 8 visualizações de página, 37 toques, 16 no botão Calcular, 6 no valor da oferta; 6/8 alcançaram 50% da página e 1/8 alcançou o final. **Amostra muito pequena**; toques não são pessoas distintas.
- GA4: 104 usuários ativos, 152 visualizações, 122 na home e 8 visualizações somadas das variantes da ferramenta; 16 eventos de cálculo concluído em apenas 2 usuários. Não interpretar como 16 clientes.
- Search Console: 31 impressões e zero cliques; URL da nova ferramenta ainda não figura nas páginas expostas na exportação, mas a publicação foi muito recente. A indexação não foi comprovada nem negada.
- Build estático do PR #3 baixado dos artifacts do GitHub Actions. Inspeção visual estática via Chromium/Playwright em 320, 360, 390, 430, 768 e 1280px (JS do Angular removido somente no HTML de inspeção visual para contornar bloqueio de navegação local; **não é um teste funcional**).

## Achados P0
1. Na captura estática **antes desta rodada de simplificação**, viewport 390px, o H2 do formulário começou ~613px abaixo do topo, o botão Calcular ~1594px abaixo do topo e o painel do resultado ~1729px. Os valores não são métricas de usuários, são posições geométricas do build renderizado.
2. Seis campos apareciam no caminho para Calcular e valores de busca pré-preenchidos eram fáceis de ignorar.
3. O resultado pré-calculado aparecia antes do envio. Não havia sensação clara de completar a tarefa.

## Correções propostas no PR #3
- Três dados essenciais sempre visíveis e primeiro CTA imediatamente depois dos ajustes progressivos.
- Busca e custo ocultos atrás de `details/summary` nativo, mas **defaults de busca = 0** e descrição explícita das premissas, para evitar custo escondido. O botão Usar exemplo completo abre os ajustes e preenche 2km/4min.
- Resultado apenas após submissão válida, antes disso instrução útil.
- Primeiro evento de cálculo na sessão separado dos recálculos repetidos.
- Link visível da home à ferramenta; site já tem canonical, prerender e sitemap.

## Benchmark de padrões (não reproduzir elementos proprietários)
- NN/g: progressive disclosure reduz complexidade percebida; mostrar opções avançadas quando relevantes.
- Baymard: minimizar campos e preservar labels e instruções para formulários móveis.
- Gridwise: trazer contexto real de ganhos por distância/tempo; **não fingir que nossa calculadora tem os dados de mercado deles**.
- Maxymo: foco em decisão rápida da oferta; **não afirmar que o CalcMot web reconhece ofertas automaticamente**.

## QA e limitações
- Confirmar QA, build Angular, Lighthouse no **último commit** e verificação real de teclado, expansão dos ajustes e foco.
- Lighthouse SEO técnico no commit anterior: 100/100. Não garante posições no Google.
- Clarity disponibiliza agregados, não as gravações individuais nesta coleta. Não diagnosticar causa dos 9 cliques inativos sem reproduções.
- Capturas visuais auditadas correspondem ao build **antes** das alterações de simplificação; não atribuir a elas validação do layout final.
