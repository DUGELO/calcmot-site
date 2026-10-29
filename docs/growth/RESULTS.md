# CalcMot — ciclo de execução de 29/10/2026

## Resultados comprovados

| Medida | Resultado |
| --- | ---: |
| Domínios candidatos com fonte de descoberta | 162 |
| Páginas oficiais registradas na triagem complementar | 50 |
| Canais qualificados para a ação específica registrada | 9 |
| Formulários concluídos e confirmados | 4 |
| Propostas individuais enviadas por Gmail (`SENT`) | 5 |
| Propostas editoriais preparadas | 20 |
| Backlinks publicados e confirmados | 1 |
| Domínios de referência conquistados e confirmados | 1 |
| Despesa com aquisição de links | R$ 0 |

Os 162 candidatos não são 162 oportunidades elegíveis. As 50 páginas triadas incluem restrições, indisponibilidades e exclusões. Os 232 resultados brutos de `discovery.json` são material de pesquisa, não um indicador de aquisição. As metas de 60 elegíveis e 30 submissões não foram atingidas neste ciclo. Não há evidência de esgotamento de todos os canais restantes.

## Link publicado

- Página externa: https://indexflow.tech/directory
- Destino observado: https://calcmot.com.br/
- HTTP: 200; link exato no HTML e no DOM do navegador.
- `rel`: `noopener noreferrer`, sem `nofollow`, `sponsored` ou `ugc`.
- Meta robots: `index, follow`; canonical aponta para o próprio diretório.
- Evidências: `verified-links.json`, `evidence/indexflow-dom.json`, `evidence/indexflow-published.jpg`.
- Indexação efetiva, audiência, DA/DR, tráfego de referência e impacto em posições: não comprovados. O diretório é generalista; não equivale a uma recomendação editorial automotiva.

## Submissões realizadas

| Canal | Evidência | Situação |
| --- | --- | --- |
| Launching Next | recibo 170739, `evidence/launching-next-submitted.jpg` | Na fila; site estima quatro meses; sem upgrade |
| SaaSolution | recibo 885, `execution-log.json` | Aguardando avaliação; comprovante visual local preservado |
| IndexFlow | página externa acima e verificação HTTP | Publicado e link confirmado |
| Phyco | `evidence/phyco-submitted.jpg` | E-mail confirmado e ficha na fila de revisão |

As cinco mensagens individuais foram enviadas a AutoPapo, Tecnoblog, Olhar Digital, AppsApk e Revista Auto, após verificar o canal oficial e consultar envios anteriores para evitar duplicação. IDs Gmail, destinatários, assuntos e textos estão em `evidence/editorial-sends.json`. `SENT` comprova envio pela conta conectada; não comprova entrega, leitura, resposta, aprovação nem backlink. Nenhuma cobrança ou publicação paga foi aceita. Não foi encontrado aviso de falha de entrega na consulta específica efetuada ao final dos envios, o que também não garante entrega.

## Pendências externas específicas

- Launching Next, SaaSolution e Phyco: análise editorial.
- Cinco destinatários dos emails: eventual avaliação ou resposta, sem novos disparos automáticos.
- AppBreakup e AppLauncher: termos proíbem submissão automatizada; requerem execução manual do responsável. A ficha AppBreakup permanece preparada na sessão do navegador.
- PitchWall, Product Hunt e plataformas equivalentes: login e eventuais consentimentos de termos/onboarding ainda indisponíveis na sessão usada.
- Inova Simples: ação do formulário bloqueada pela política de segurança do navegador; nenhum contorno por outro canal foi tentado.
- TryMy.App: bloqueio do filtro corporativo Fortinet; requer liberação pela administração da rede, sem evasão.
- AppAgg: página de verificação sem formulário utilizável na sessão.
- Ignlab Launch: timeout de navegação e documento de erro bloqueado; nenhuma submissão realizada.
- SaaSHub: regras rejeitam produtos sem versão em inglês; landing atual em português.

## Implementação e validação

Evolução dos 19 registros e do auditor do PR #17, recuperados pelo ref `06e1322fd62729d3b931d87de2c84f94a5f6085a`. O PR #15 do blog permanece independente; os envios deste ciclo usam ferramentas já públicas, sem depender do blog.

O engine separa descoberta, qualificação por evidência, preparação, submissão, espera, publicação declarada, link confirmado, rejeição e bloqueio. Ingestão/deduplicação, scoring, tracker, auditor HTTP/HTML e relatório estão em `scripts/growth/`. O workflow semanal verifica apenas URLs publicadas registradas e gera artifacts; não envia mensagens ou formulários, não publica conteúdo e não altera produção. Resultados de verificação são cópias para revisão; o workflow não grava automaticamente seu histórico de volta no Git. Preserve o artifact anterior ao consolidar o próximo ciclo.

Validação detalhada em `QA.md`; comandos: `node --test tests/growth/*.test.mjs`, `npm run qa:static`, `npm run build`, `node docs/growth/editorial/verificar-cenarios.mjs`. A metodologia e os quatro cenários são originais e hipotéticos; não usam dados de usuários. Artigo DEV preparado, sem publicação: respeitar as regras de conteúdo substancial e não usar a comunidade como canal de campanha de backlinks.

## Próximo ciclo priorizado

1. Verificar as três filas pendentes e eventuais respostas aos cinco envios; registrar URL publicada antes de contar novo backlink.
2. Validar a categoria, regras completas e identidade da plataforma antes de novas submissões em Startup Dope e ProductReveal; a segunda pede texto de 500–5000 palavras e mídia. Não estão submetidas.
3. Qualificar os candidatos de diretórios Android e os portais que já cobrem custos de motoristas. Descartar IA exclusiva, sites sem função editorial clara e exigências de troca de links.
4. Concluir manualmente os canais com proibição de automação e usar sessões autenticadas apenas quando disponibilizadas pelo responsável.
5. Publicar o ativo metodológico somente após homologação de produção; ele já pode ser fornecido individualmente às redações que demonstrarem interesse. Não anunciar uma URL de conteúdo ainda inexistente.

Os arquivos visuais com e-mail pessoal ficam somente no workspace e estão ignorados pelo Git. Tokens de confirmação e links privados de edição não integram o repositório.
