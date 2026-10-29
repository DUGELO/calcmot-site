# Operação editorial

## Ativação na branch

1. Acessar [Pages CMS](https://app.pagescms.org), entrar com GitHub e instalar seu GitHub App apenas em DUGELO/calcmot-site.
2. Selecionar codex/calcmot-blog para homologação, nunca main durante o teste. Confirmar que o Pages CMS lê .pages.yml e mostra Artigos do CalcMot.
3. Manter alterações editoriais em branch revisável; abrir PR para main. Confirmar proteções e a configuração real de branches do Cloudflare antes de publicar.
4. Criar um rascunho real. Salvar e verificar o Markdown no GitHub. Não é necessário editar componentes Angular.
5. Preencher título, slug único sem acentos, resumo, categoria, autor responsável, publicação, capa e descrição da imagem. Começar títulos internos em H2.
6. Pré-visualização local: npm ci; npm start. O prestart gera catálogo e sitemap. Após salvar novo conteúdo, reiniciar para regenerar. Rascunhos não possuem preview público.
7. Publicar na branch de homologação, executar npm run test:blog, npm run qa:static, npm run build e npm run qa:blog:build. Abrir /blog/slug/ sem JavaScript e conferir texto e metadados.
8. Após aprovação editorial e técnica, merge e publicação seguem o processo existente. Este PR não executa deploy.
9. Só após deploy autorizado, conferir HTTP 200, canonical, sitemap e Search Console na URL de produção.

## Limite do repositório público

DUGELO/calcmot-site é público. Rascunhos não aparecem no site nem no sitemap, mas seus arquivos e histórico podem ser lidos no GitHub. Não guardar conteúdo confidencial. O site não controla indexação do próprio GitHub; sigilo exigiria repositório privado ou armazenamento editorial privado separado.

## Regras de publicação

- draft é o padrão. Só published com data não futura entra no HTML público, bundle e sitemap.
- Título/resumo são fallback SEO quando campos SEO estão vazios. Não repetir títulos ou descrições entre artigos.
- Capa raster local até 8 MB e 40 milhões de pixels, sem animação. O build gera WebP responsivo e dimensões explícitas; originais são públicos.
- Imagens do Markdown também precisam estar em /media/blog/. O build valida e otimiza; links externos usam HTTPS. HTML arbitrário aparece como texto e não executa.
- Não colar tabelas de ganhos, taxas ou impostos sem fonte, localidade e data. Não prometer renda. Distinguir receita, custo e lucro.
- updatedAt registra revisão substantiva; não mudar só porque o build rodou.
- Slug publicado deve ser estável. Se precisar mudar, adicionar slug antigo em aliases do artigo; confirmar redirect 301.
- Canonical alternativo só em republicação autorizada. O padrão é a própria URL. URL externa remove o artigo do sitemap.
- Para retirar um artigo, voltar a draft e revisar links internos e aliases. URL retirada responde 404. Para substituir por outro, transferir o slug antigo para aliases do substituto.
- Slugs reservados: pagina e categoria. Datas futuras não publicam por relógio; é necessário salvar/publicar e construir novamente.
- Paginação automática a cada 12 artigos, incluindo categorias. Não há post de demonstração entregue.

## Comandos

- npm run content:generate: validar conteúdo e gerar imagens, módulos e sitemap.
- npm run test:blog: testes de segurança, metadados, mídia, drafts e roteamento.
- npm run test:blog:publication: publica 13 fixtures temporárias, compila SSR/SSG/Cloudflare e verifica HTML, 404 e redirects. Remove só seus próprios arquivos em finally. Rodar em checkout limpo, sem build simultâneo.
- CALCMOT_BLOG_UI_PYTHON=python habilita Chromium no teste de publicação; instalar playwright==1.58.0 e chromium antes.
- npm run qa:blog:build: conferir HTML do build normal.
- npm run build:cloudflare: compilar integração neutral sem deploy.
- npx wrangler deploy --dry-run --config wrangler.jsonc --outdir .angular/worker-dryrun: empacotar sem publicar.
- node scripts/verify-blog-workerd.mjs: conferir roteamento real local.

Após teste de publicação, os fontes gerados voltam ao catálogo real; executar npm run build e npm run build:cloudflare antes de inspecionar ou distribuir artefatos. Fixtures e screenshots ficam em .angular e não devem ir para produção.

## Medição

Usar GA4 existente: páginas de destino /blog/* + canal Organic Search, engajamento e eventos web_calculator_link_clicked / web_play_store_clicked. source_page distingue blog_article e blog_index; link_placement usa blog_tool e blog_play nos CTAs. Links contextuais usam os mesmos eventos sem novo listener; page_location identifica o artigo.

Não adicionar page_view manual: enhanced measurement já atende visitas. Confirmar dimensões personalizadas do GA4 em ambiente real antes de depender delas em relatórios. O site mede intenção/clique na Play Store; instalação real depende de instrumentação Android ainda fora deste escopo.

## Aceite externo pendente

O proprietário precisa homologar a sessão editorial real, salvar um artigo pelo Pages CMS na branch e conferir o build desse commit. Testes locais cobrem o mesmo formato de conteúdo, mas não substituem login/permissões do serviço. Não há autorização para merge ou deploy automático neste trabalho.
