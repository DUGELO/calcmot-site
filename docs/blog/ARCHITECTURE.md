# CalcMot Blog — diagnóstico e decisão

Data da auditoria: 29/10/2026. Base auditada inicialmente: main, d7a99109; integrada à main 0b8408e antes da entrega. Branch: codex/calcmot-blog.

## Diagnóstico do repositório

- Angular 21.2, standalone, TypeScript 5.9, SCSS. Node recomendado pelo repositório: 22.16.
- Build application com outputMode server, entrada Node/Express em src/server.ts. Páginas públicas já usam RenderMode.Prerender; fallback local usa SSR.
- Produção usa Cloudflare Workers + Assets. scripts/build-cloudflare.mjs copia a aplicação para workspace isolado e troca apenas ali a entrada SSR por AngularAppEngine em plataforma neutral. Não é necessário migrar o site nem executar Express no Worker.
- Seis páginas públicas antes do blog: início, como funciona, calculadora de ganhos, calculadora de corrida, privacidade e suporte. O wildcard antigo redireciona à home; precisa ser interceptado no namespace editorial para evitar soft 404.
- public/sitemap.xml era gerado separadamente a partir de app.routes.ts com lastmod da execução. A integração agora roda antes do build, exclui rotas parametrizadas e usa datas editoriais reais. Páginas institucionais ficam sem lastmod em vez de anunciar atualização inexistente.
- Header, footer, CTA, tokens e PageMetaService são compartilhados. O blog mantém cores, tipografia, componentes globais e navegação; acrescenta apenas conteúdo e estilos próprios.
- SEO anterior: title, description, canonical, OG/Twitter institucionais, JSON-LD e robots. ogImage global está vazio. Artigos ganham imagem otimizada e tipo article próprios.
- /admin é CSR, lazy, autenticado com Firebase, sessão e backend administrativo externo. Gerencia solicitações, não conteúdo editorial. Worker protege shell, cache e indexação. Não foi alterado.
- GA4 e Clarity inicializam após hidratação, somente em hosts de produção. GA4 enhanced measurement já possui page_view e History API; não há page_view manual adicional.
- CI já valida guardrails, calculadora, atribuição, admin, SSR/prerender, pacote Wrangler dry-run, workerd e Chromium mobile. Deploy pertence à integração GitHub main → Cloudflare, fora deste trabalho.
- Existem alterações não commitadas de outro trabalho no checkout original. Este trabalho parte da main em worktree separado e não as inclui.

## Pages CMS validado como integração

Usar a instância hospedada do Pages CMS e GitHub App. .pages.yml é lido por repositório/branch; coleção usa YAML frontmatter e body Markdown. Imagens são arquivos versionados no GitHub. Não há CMS próprio, banco editorial, autenticação nova ou chamada ao CMS em runtime.

Validação da configuração: sintaxe YAML e campos cobertos por testes, conforme documentação oficial consultada. A sessão autenticada do editor e a instalação do GitHub App dependem do proprietário e devem ser homologadas na branch antes do merge. Não afirmar que esse login foi testado sem realizá-lo.

A disponibilidade/termos da instância hospedada são uma dependência externa; não foi contratado plano pago. Self-hosting implicaria operação e configuração adicionais e não foi escolhido.

## Arquitetura implementada

1. Editor salva Markdown em content/blog e imagens raster em public/media/blog usando o CMS.
2. Status padrão draft. Draft incompleto é permitido; status inválido e colisão de slugs falham. Nenhum corpo ou título de draft é gerado no código público.
3. content:generate valida publicados, datas, unicidade, categorias, links, canonical e mídia. Markdown não aceita HTML executável. Sanitização por allowlist e Angular innerHTML preservam defesa em camadas, sem bypassSecurityTrustHtml.
4. Sharp decodifica imagens locais, limita bytes/pixels e gera WebP 480/800/1200 com cache por hash. Imagens remotas, SVG e animações não são aceitas. Originais editoriais são públicos; não enviar imagens sigilosas mesmo em rascunhos.
5. Gerador produz metadados, módulos individuais de corpo e manifestos de rotas ignorados pelo Git. O resolver Angular aguarda o corpo antes da renderização.
6. Angular enumera artigos, categorias e páginas (12 artigos por página), prerenderiza e gera HTML completo. Links são anchors comuns, rastreáveis sem JS.
7. Assets serve páginas existentes. Wrapper do Worker responde 404/noindex para rotas editoriais não publicadas e 301 para aliases. SSR Node também resolve aliases e responde 404 editorial. Rascunhos não recebem shell público com falso 200.
8. Sitemap inclui apenas publicados com canonical próprio, listagens e rotas públicas existentes. Canonical externo deliberado exclui o artigo do sitemap.
9. Build inválido falha antes de promover o artefato; o último deploy permanece até um novo deploy válido.

Rotas: /blog/, /blog/:slug/, /blog/pagina/:page/, /blog/categoria/:category/ e paginação de categoria. Sem páginas vazias de categorias ainda não usadas.

## Arquivos e impactos sensíveis

Criados: .pages.yml; content/blog; public/media/blog; scripts/blog/content.mjs; generate-blog; verificadores e testes; src/app/blog; cloudflare/blog-routing; docs/blog.

Modificados: app.routes.ts; app.routes.server.ts; PageMetaService; site-copy (link Blog); classificação de origem analítica; styles.scss; index.html (fallback com parágrafo em lugar do H1 adicional); gerador sitemap; package/lock; gitignore; CI; composição do Worker.

app.routes.server.ts foi alterado exclusivamente para prerender editorial e 404. Hooks npm geram conteúdo antes de build/start. scripts/build-cloudflare.mjs também prepara conteúdo quando chamado diretamente. angular.json, src/server.ts e main.server.ts são preservados. Nenhuma configuração de domínio, segredo ou ambiente administrativo foi alterada.

Quatro dependências de desenvolvimento versionadas: yaml, markdown-it, sanitize-html e sharp. Não entram no bundle do navegador/Worker. Gerados são obrigatórios antes de ng build direto; preferir npm run build.

## Riscos, limites e alternativas

- CMS com gravação direta em main poderia publicar imediatamente via integração existente. Revisar conteúdo em branch editorial e PR. Proteções GitHub/Cloudflare e permissões reais precisam ser confirmadas pelo proprietário; o código não altera essas contas.
- Alteração de slug exige informar aliases antes de publicar. Build detecta conflito/ciclo direto; não descobre automaticamente URLs antigas ausentes do Git atual. Não retirar aliases de URLs que já tiveram tráfego.
- Datas usam dia editorial explícito. updatedAt vazio usa publishedAt. Datas futuras falham; não existe agendamento automático. Manter draft e publicar na data desejada.
- Imagens devem ser próprias/licenciadas; texto fiscal e regras das plataformas precisam de revisão datada com fontes.
- Arquivos Markdown privados não são servidos; imagens originais em public são públicas. O repositório auditado é público: os Markdown de rascunho e o histórico podem ser lidos no GitHub. A exclusão do site não garante sigilo nem controle de indexação do próprio GitHub. Sigilo editorial exigiria armazenamento privado.
- Conteúdo é estático até novo build. CMS indisponível não derruba o blog publicado. Substituições e exclusões exigem revisão de sitemap/redirects.
- Metadados do catálogo crescem com a coleção; corpos são chunks individuais. Monitorar tempo de build e limite de Assets do plano Cloudflare antes de milhares de páginas; não introduzir busca/back-end antecipadamente.
- Alternativas: edição Markdown por PR mantém a mesma arquitetura se o CMS indisponibilizar; outro CMS Git poderia substituir apenas o editor. CMS com banco/API ou SSR editorial por requisição aumentaria dependências e custo sem necessidade atual.
- Sem novo serviço analítico. GA4 permite tráfego orgânico/engajamento por page_path e cliques por página. Eventos existentes recebem source_page blog_article/blog_index e placements blog_tool/blog_play. Não equivale a instalar o app; atribuição de instalação efetiva requer integração Android separada.

## Etapas e esforço estimado

Estimativa inicial: 3–5 dias úteis de engenharia incluindo homologação editorial externa.

1. Auditoria e decisão: 0,5 dia.
2. CMS, validação e geração: 1 dia.
3. UI responsiva, SEO, navegação e atribuição: 1–1,5 dia.
4. Publicação em fixtures, SSR, Chromium, workerd, regressões e PR: 1 dia.
5. Proprietário instala GitHub App, testa editor em branch e aprova release: 0,5–1 dia, conforme acesso.

Nenhum deploy de produção é executado. O aceite editorial real e o teste remoto após aprovação permanecem etapas explícitas de homologação, não resultados simulados.

## Fontes consultadas

- [Pages CMS: configuração](https://pagescms.org/docs/configuration/)
- [Pages CMS: quick start e GitHub App](https://pagescms.org/docs/quick-start/)
- [Campos/body](https://pagescms.org/docs/configuration/content/fields/)
- [Filename](https://pagescms.org/docs/configuration/content/filename/)
- [Mídia](https://pagescms.org/docs/configuration/media/)
- [Angular: SSR e prerender parametrizado](https://angular.dev/guide/ssr)
- [Cloudflare: Angular](https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/angular/)
- [Cloudflare: Assets](https://developers.cloudflare.com/workers/static-assets/)
