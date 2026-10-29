# Growth CalcMot — Operação gratuita de backlinks

**Objetivo:** obter referências editoriais reais, tráfego e autoridade temática; DA de terceiros é apenas indicador secundário.

## Fluxo
1. Abrir `docs/growth/prospects.json` e escolher oportunidades prioridade A.
2. Confirmar regras atuais, elegibilidade e gratuidade no site oficial antes de cada envio.
3. Criar conta manualmente ou enviar proposta individual personalizada, quando autorizado.
4. Atualizar `submissionStatus` entre `not_sent`, `submitted`, `rejected`, `published`, `unavailable`.
5. Marcar `published` com URL e evidência da publicação; usar `link_confirmed` somente após verificação do backlink.
6. Rodar `node scripts/growth-audit.mjs`; o workflow semanal cria relatório como artifact, sem envio ou postagem.

## Pautas editoriais sugeridas
- Como comparar **receita por km e lucro por km** com exemplos matemáticos auditáveis.
- **Quanto custa rodar 100 km**? Apresentar planilha aberta com cenários, hipóteses e limitações.
- Relatório agregado **Radar CalcMot**, **somente** com consentimento e amostra suficiente. Não inventar médias nem expor dados individuais.
- Case técnico sobre o Angular SSR e a calculadora, para comunidades de desenvolvimento.

## Modelo de proposta editorial — individualizar e revisar
Assunto: Sugestão de pauta — como motoristas podem comparar lucro por km

Olá, equipe editorial. Produzimos o CalcMot, ferramenta para ajudar motoristas a comparar receita, custos e resultado das corridas. Gostaria de sugerir uma pauta útil aos seus leitores sobre a diferença entre ganho por km e lucro real, com exemplos e metodologia verificável. Podemos disponibilizar um exemplo de cálculo ou responder perguntas técnicas. Site: https://calcmot.com.br/. Caso seja relevante à linha editorial, posso enviar um resumo personalizado. Obrigado!

**Não** pedir backlink como condição para cobertura, enviar mensagens genéricas em massa, criar avaliações falsas, spam em comentários ou pagar por listas de links. Respeitar preferências de contato, LGPD e políticas das comunidades.

## Critérios de qualidade
Relevância do assunto, audiência real, autenticidade do veículo, possibilidade de referência editorial natural, integridade do conteúdo e baixa exigência de esforço. Links `nofollow` também podem gerar visitantes; não usar somente DA/DR para pontuar.

## Medição
Mensalmente: domínios de referência confirmados por ferramenta externa, links novos/perdidos, tráfego de referência em GA4 e cliques orgânicos por landing page no Search Console. O workflow **não** tem acesso às APIs de Moz/Ahrefs nem prova sozinho a existência do link.

## Growth Engine local

`node scripts/growth/discovery-plan.mjs` imprime JSON com 16 consultas específicas e URLs de busca, agrupadas em diretórios de apps, pautas para motoristas, páginas de recursos e menções a concorrentes. É somente geração local de plano: execute buscas por revisão humana ou ferramenta MCP autorizada; não há scraping de buscadores nem descoberta automática.

A ingestão aceita também `{date, candidates: [{name, domain, url, discovery_source, category, status, evidence}]}`. `discovery_source` e evidência ficam preservados; os registros entram como leads `discovered`, com custo/elegibilidade desconhecidos. `node scripts/growth-engine.mjs ingest docs/growth/candidates.json result.json --dedupe-domain` ignora candidatos do mesmo hostname (normalizando `www.`), além da deduplicação padrão por ID/URL. Não agrega subdomínios distintos nem infere domínio registrável; referências existentes não são substituídas.

O inventário original de 19 oportunidades foi preservado do PR 17, ref `06e1322fd62729d3b931d87de2c84f94a5f6085a`. As condições antigas não são validação atual de gratuidade ou elegibilidade.

Estados atuais: `discovered`, `qualified` (alias `eligible`), `drafted` (alias `preparing`), `submitted`, `awaiting_review`, `published`, `link_confirmed`, `rejected`, `blocked_external`. Legados `approved`, `unavailable` e `lost` continuam aceitos. `awaiting_review` exige URL e nota de evidência; protocolo é opcional; `published` declara uma URL de publicação, sem afirmar backlink; `link_confirmed` exige verificação presente, HTTP 200, domínio, URL final e data válida. O relatório projeta estados confirmados pelo ledger, mantendo a fila como `awaiting_review`.

Páginas públicas conhecidas maiores podem declarar `verificationMaxBytes` por target, entre 1024 e 8388608 bytes (padrão 1048576). Exemplo: IndexFlow usa 8388608. Essa opção mantém timeout, validação de rede, limite de redirects e teto absoluto de 8 MiB; não desativa as proteções.

O audit lê automaticamente `execution-log.json`, incorpora eventos ao inventário projetado do relatório e contabiliza submissões comprovadas separadamente de backlinks. Confirmação exige URL e evidência; protocolo é opcional no ledger. `awaiting_review` representa fila, nunca backlink confirmado. O arquivo original e o ledger não são reescritos. A ingestão aceita também `discovery.json` com `{date, results}`; exclui registros classificados como concorrentes/descartados e mantém custo/elegibilidade desconhecidos, preservando fonte e consultas para revisão.

- `node --test tests/growth/*.test.mjs`: testes offline, com páginas e fetch injetado.
- `node scripts/growth-audit.mjs growth-outreach-report.md`: valida inventário e gera Markdown/JSON.
- `node scripts/growth-engine.mjs ingest candidates.json result.json`: importa array de oportunidades, sem sobrescrever duplicatas por ID ou URL normalizada; exige `discoveryEvidence: {url, checkedAt}`.
- `node scripts/growth-engine.mjs track changes.json result.json`: aplica array `{id, stage, evidence: {url, note}}`; `published` exige URL; `link_confirmed` exige backlink verificado.
- `node scripts/growth-engine.mjs verify docs/growth/prospects.json result.json`: verifica somente URLs públicas em `publishedUrl`, máximo 50 oportunidades; produz cópia com histórico. Revise o resultado antes de incorporar ao inventário.

Os estados e aliases aceitos estão listados acima. O legado `submissionStatus: not_sent` continua compatível. Nenhum comando envia contatos, faz cadastros ou publica conteúdo.

Pontuação: relevance 30, audience 25, editorial 25, free 10, lowEffort 10. Cada critério exige `evidence.<critério>: {value: true, url, checkedAt, note}`; prioridade antiga, suposições e ausência de dados não rendem pontos. DA, DR, GA4 e Search Console permanecem `null` sem integração/evidência.

Verificação usa parse5 já instalado pelo projeto, inspeciona anchors, hostname exato, rel, HTTP, meta robots, X-Robots-Tag e canonical. Registra datas, domínio e histórico. `nofollow`, `ugc` e `sponsored` continuam links presentes, com `followed: false`. Indexação permanece desconhecida; robots.txt recebe indicação de revisão, pois permissões dependem de agente e caminho. HTTP 404/410 ou HTML 200 sem link confirmam ausência; timeout, 403, 429, 5xx e conteúdo não HTML não confirmam perda. Não executa JavaScript nem prova links renderizados apenas no cliente.

A rede aceita GET HTTP(S), portas padrão, bloqueia IPs privados/reservados, valida cada redirecionamento e fixa o DNS validado na conexão. Limites: 10 s por requisição, 1 MiB, quatro redirects; sem credenciais, cookies ou contas. O workflow só gera artifacts revisáveis e não atualiza produção nem faz commit automático.
