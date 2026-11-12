# Operação editorial privada — 06/11/2026

## Decisão e estado observado

Pages CMS foi mantido após prova autenticada de criação visual, formatação H2, upload, salvar, sair/reabrir, recuperar uma revisão e solicitar publicação pelo próprio artigo. O primeiro artigo real foi confirmado em produção no run privado `42224893824`, com auditoria SEO 100 em nove páginas antes e depois da distribuição. Os quatro artigos, atualização, retirada e restauração foram confirmados. A release final `42270900063-1` usa código `584cd815fa9614fa2a8e692f6c3b2e9bdb78b23f` e 15 páginas com SEO 100 antes/depois. Evidências e limites reais estão em PRIVATE-QA.md.

O [PR público #15](https://github.com/DUGELO/calcmot-site/pull/15) e a [correção #19](https://github.com/DUGELO/calcmot-site/pull/19) foram integrados com autorização explícita de produção. O código continua Angular 21 SSR/prerender. O repositório [calcmot-content](https://github.com/DUGELO/calcmot-content) é privado e contém a configuração editorial e os originais. Nenhum artigo real foi versionado neste repositório público.

## Fluxo sem ferramentas técnicas para o editor

- `main` privada: trabalho salvo; nenhum push dispara publicação.
- `published` privada: última combinação código/conteúdo cuja entrega foi confirmada.
- Tags privadas `releases/<run>-<attempt>`: candidatos imutáveis, revisão exata e base de rollback.
- **Publicar** seleciona caminho, commit e blob do artigo salvo; somente o artigo e suas imagens entram no novo snapshot.
- **Retirar** preserva o texto privado. **Recuperar** restaura texto/mídias na área de trabalho, sem publicar.
- Datas são do dia real em America/Sao_Paulo. Repetir conteúdo idêntico não fabrica atualização ou outro build.

Título, texto visual, categoria, capa e resumo opcional formam o fluxo principal. Autor, slug, canonical, SEO e datas são derivados quando omitidos. Opções adicionais permitem personalização. O nome do arquivo permanece estável; mudanças explícitas de slug preservam aliases anteriores.

## Segurança e consistência

O build usa exclusivamente snapshot selado por hashes, fora do código público. Links simbólicos, traversal, HTML inseguro, links perigosos, mídia ausente ou sem uso, rascunhos e arquivos extras são rejeitados. Imagens aprovadas recebem nomes pelo hash dos bytes; os originais permanecem privados e somente versões WebP responsivas necessárias são distribuídas.

A fila privada serializa publicações. Além da fila, revisões antigas do mesmo artigo são rejeitadas, e a promoção de `published` usa verificação de head/CAS. Não há merge indiscriminado de `main` para `published`.

A sequência é selecionar → validar → construir uma vez → empacotar → auditar SEO → persistir candidato → enviar versão sem tráfego → promover ID exato → conferir recibo, HTML, sitemap, 404 e SEO público → avançar `published`. A resposta da API Cloudflare é somente um recibo; pesos e entrega são conferidos por GET e no domínio. Falha tenta restaurar os pesos anteriores somente se a distribuição ainda pertencer à execução.

Se o processo cair após distribuir, a próxima execução verifica o recibo e repete smoke/SEO antes de reconciliar. Divergência não comprovada bloqueia novas distribuições. O recibo público contém apenas IDs e hashes, sem drafts, histórico ou caminhos de origem.

## Uma autoridade de produção

O gatilho de produção legado do Workers Builds foi desabilitado e conferido no painel. Previews do código permanecem separados e sem conteúdo privado. O coordenador privado opera com `CALCMOT_DEPLOY_AUTHORITY=private-actions` e produção autorizada.

O CI da `main` pública solicita a publicação integrada apenas após o job técnico passar. O GitHub App privado autorizado tem Actions write e Metadata read, instalado somente em `calcmot-content`. A chave fica cifrada no ambiente `editorial-dispatch`, restrito à `main`; os tokens de instalação são temporários. Nenhum PAT pessoal é armazenado no pipeline.

O Worker existente, domínio, segredo Gemini, rate limiter e ambiente administrativo PROD foram preservados. Não foi criado backend de CMS, banco ou serviço pago.

## Limites reais do Pages CMS

- O editor visual funciona como preview de formatação, sem reproduzir o layout do site. Preview externo protegido e agendamento continuam melhorias posteriores.
- A recuperação concluiu com indicador verde no histórico nativo. É necessário reabrir o formulário para carregar o texto recuperado.
- Na navegação interna testada, uma alteração não salva foi descartada sem aviso. O conteúdo salvo permaneceu íntegro. O guia exige Save antes de sair; não anuncia autosave.
- Botões de ações e opções adicionais são recursos nativos; a barra pode exigir rolagem horizontal em telas estreitas. Os rótulos foram reduzidos para Publicar, Retirar e Recuperar.
- O retorno da ação só fica verde após o workflow verificar a entrega. Um pedido em fila não equivale a artigo publicado.
- A primeira publicação real levou 8 min 03 s do pedido ao término, acima da meta ideal de cinco minutos. A cobertura SEO integral é obrigatória; a auditoria foi paralelizada sem retirar URLs ou critérios para reduzir a duração. O job final com auditoria paralela levou 5 min 21 s, além da fila. Medições ficam em PRIVATE-QA.md.

## Referências

[Pages CMS actions](https://pagescms.org/docs/configuration/actions/), [campos](https://pagescms.org/docs/configuration/content/fields/), [rich text](https://pagescms.org/docs/configuration/fields/rich-text/), [Decap editorial workflow](https://decapcms.org/docs/editorial-workflows/), [GitHub concurrency](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#concurrency), [Cloudflare build branches](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/).

Decap foi considerado como alternativa com workflow editorial nativo, mas exigiria validar OAuth/gateway e uma segunda integração. A prova atual do Pages CMS permite manter o fluxo principal sem construir um CMS próprio. Não foi alegado teste de usabilidade com um participante humano externo: a evidência é a operação autenticada pela interface real, descrita no registro de QA.
