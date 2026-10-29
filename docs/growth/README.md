# Growth CalcMot — Operação gratuita de backlinks

**Objetivo:** obter referências editoriais reais, tráfego e autoridade temática; DA de terceiros é apenas indicador secundário.

## Fluxo
1. Abrir `docs/growth/prospects.json` e escolher oportunidades prioridade A.
2. Confirmar regras atuais, elegibilidade e gratuidade no site oficial antes de cada envio.
3. Criar conta manualmente ou enviar proposta individual personalizada, quando autorizado.
4. Atualizar `submissionStatus` entre `not_sent`, `submitted`, `rejected`, `published`, `unavailable`.
5. Só marcar `published` com `publishedUrl` verificada e evidência da página publicada.
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
