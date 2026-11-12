# Evidências da integração privada — 06/11/2026

## Verificações técnicas

- `qa:static` e build Angular aprovados.
- 20 testes editoriais: snapshots individuais, isolamento de mídia, integridade, aliases, revisão antiga após aprovação sem mudança, CAS real de Git, recuperação de texto/mídia, rollback e contrato Cloudflare incluindo POST que retorna apenas ID.
- Sete testes do blog; 43 testes administrativos e regressões de calculadora, analytics, edge, ambiente e análise de corrida aprovados no CI.
- Snapshot sintético com 13 publicados e draft separado: 23 rotas, 17 editoriais, HTML sem JS, sitemap, dados estruturados, aliases e HTTP 404.
- Chromium em 320, 390, 768, 1024 e 1440 px; imagens, categorias, paginação e navegação. Empacotamento Wrangler dry-run e workerd com Assets aprovados.
- Lighthouse real: 23 páginas de fixtures e sete do catálogo vazio, todas SEO 100. Quatro artigos reais em snapshot privado: 15 páginas, todas SEO 100.
- Teste negativo executa Lighthouse real numa página sem meta description e exige nota inferior a 100 e bloqueio. Não aceita erro genérico de processo como prova do teste.
- Toda publicação audita cada URL pública do sitemap e cada rota editorial, sem amostragem, antes e depois de distribuir. Relatório ausente, nota inferior a 100, erro de execução ou redirecionamento para outra página bloqueiam a confirmação.

## Operação autenticada e produção — confirmação final

| Cenário | Evidência real |
| --- | --- |
| Criar, salvar, sair e retomar | Rascunho criado no Pages CMS; H2 e texto reapareceram após reabrir |
| Upload e visualização | Capa enviada pelo seletor nativo; imagem e conteúdo presentes no formulário |
| Recuperar salvamento | Run `42223446974` terminou com sucesso; blob anterior restaurado e reaberto no CMS |
| Alteração não salva | Navegação interna descartou a alteração sem aviso; versão salva permaneceu intacta |
| Publicar | Botão do artigo iniciou `42224893824`; run confirmado, nove páginas SEO 100 antes e nove depois |
| Salvar artigo já publicado | Nova revisão `fdd25624c6bab1c27266f124d09cae9a79ca2acf` ficou privada; HTML público manteve resumo anterior |
| Preservar admin | `/admin` HTTP 200, cabeçalho PROD e noindex após a primeira distribuição |
| Rascunho e inexistente | URLs testadas retornaram HTTP 404/noindex; ausência no catálogo público |
| Googlebot | Resposta HTTP 200 com esse user-agent; isso não equivale a confirmar indexação no Search Console |
| Falha real e rollback | Primeira tentativa `42151325957` encontrou recibo Cloudflare incompatível; tráfego anterior foi restaurado e `published` não avançou. Correção integrada no PR #19 |
| Código → publicação | Main `584cd815fa9614fa2a8e692f6c3b2e9bdb78b23f` aprovada no CI `42269776831`; App executou `42270900063` preservando exatamente os quatro artigos |
| Atualizar explicitamente | Run `42226393789` confirmou a revisão salva; 15 páginas SEO 100 antes/depois |
| Retirar | Run `42267858507`: artigo HTTP 404, ausente do sitemap e preservado na main privada; 13 páginas SEO 100 antes/depois |
| Restaurar publicação selecionada | Run `42269742250` restaurou código, digest e arquivos da tag `42226393789-1`; quatro artigos e 15 páginas SEO 100 antes/depois |
| Nova entrega otimizada | Run `42270900063`: 15 páginas SEO 100 antes e depois, mesmo conteúdo aprovado e novo código confirmado |
| Bindings e ambiente | Inspeção `42272438110` aprovada: PROD, compatibility date 2026-10-19, ASSETS, segredo Gemini e rate limiter namespace 1002 preservados |
| Privacidade do contexto | Novos runs de retirada, rollback e rebuild não imprimiram o payload bruto do CMS |
| HTML integral dos quatro artigos | Comparação independente do HTML sem JS com todo o Markdown aprovado passou para os quatro, incluindo schema, canonical e datas |
| Mobile real | Quatro artigos em 320 e 390 px: sem overflow, capa carregada e H1 único; links contextuais e texto completo presentes |

A primeira publicação usou código `f213946a3f1376ff563d9c9cd57550a28c83cbce` e registrou `published` somente após a conferência remota. Início do pedido 13:21:52 UTC; término 13:29:55 UTC, total 8 min 03 s. Não usar períodos de suspensão da máquina local como SLA.

Todos os pedidos acima foram confirmados. O recibo público e a branch published correspondem à release `42270900063-1`. O snapshot digest `5345b7cd2b456da18f1a4adae88a024f0c7b95df7ecc4623e5aead415d12ade1` e os arquivos permaneceram idênticos após a mudança de código. O código final é `584cd815fa9614fa2a8e692f6c3b2e9bdb78b23f` (PR #20).

O job otimizado começou às 18:31:53 UTC e terminou às 18:37:14 UTC: **5 min 21 s**. O pedido entrou às 18:27:38 UTC e aguardou 4 min 15 s na fila da restauração. A meta ideal de cinco minutos não é garantia de prazo. A janela local de auditoria dos mesmos 15 caminhos caiu de 325 s para 142 s, mantendo todos os relatórios e critérios. O teste negativo continuou rejeitando nota abaixo de 100.

A mídia original privada não foi servida. Para URL de mídia inexistente, o fallback legado retorna 302 para a home, sem corpo de imagem; esse comportamento não foi anunciado como HTTP 404. Artigos inexistentes e o rascunho de homologação retornaram HTTP 404/noindex.

No CMS a 390 px, a barra de ações ocupou 529 px e exigiu rolagem horizontal. O site público passou sem essa limitação. O guia recomenda computador para textos longos. A checagem de snapshot local usou checkout com core.autocrlf=false para preservar os bytes aprovados; a produção usa o runner Linux.

O CMS não exige GitHub/terminal/Cloudflare nas operações diárias observadas. Não foi conduzido teste com participante humano externo. Preview de drafts é apenas o editor visual privado, sem URL pública. Nenhuma imagem de homologação é conteúdo definitivo do blog.
