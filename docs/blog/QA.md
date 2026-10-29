# QA local — blog CalcMot

Executado em 29/10/2026 na branch codex/calcmot-blog, integrada à main 0b8408e. Nenhum deploy de produção.

| Verificação | Resultado |
| --- | --- |
| npm run qa:static | Passou |
| npm run build | Passou; 7 rotas estáticas no catálogo real sem artigos |
| npm run test:blog | 7 testes passaram; CMS, Markdown seguro, slugs/datas/aliases, imagens, drafts, paginação, Worker e fuso de São Paulo |
| npm run test:blog:publication | Passou com 13 publicados temporários e 1 rascunho |
| Prerender com fixtures | 23 rotas totais, sendo 17 editoriais; corpo integral, H1 único, canonical, robots, OG, Twitter, schema e lastmod |
| Chromium do blog | Passou em 320, 390, 768, 1024 e 1440 px; categorias, paginação, imagens, navegação e ausência de overflow/erros JS |
| Navegador sem JavaScript | Corpo integral e H1 presentes |
| Node SSR | 404/noindex para inexistentes/drafts/páginas inválidas; 301 para alias publicado |
| Wrangler deploy --dry-run | Passou com bundle neutral e Assets; não publicou |
| workerd + Assets real | Publicados 200 com corpo, drafts/ausentes 404/noindex, aliases 301 e paginação 200 |
| Retirada das fixtures | Rebuild Cloudflare passou; HTML e imagem original removidos do artefato, sem arquivos temporários no Git |
| Regressões existentes | 43 testes admin; QA admin; edge; ambientes; paridade de build; calculadora; atribuição; ride insights e Gemini passaram |
| Chromium existente | Smoke calculadora 320–1024 px, policy handoff Router e GA4 em hostname de produção simulado passaram |
| JSON-LD | JSON do HTML de artigo foi parseado; BlogPosting e BreadcrumbList com campos editoriais presentes |

As imagens temporárias são blocos azuis para testar responsividade e otimização. Os textos, imagens e artigos de teste são criados e removidos pelo script, não são conteúdo definitivo. Screenshots locais ficam em .angular/blog-publication; não foram commitados.

O build final contém apenas a listagem vazia e as seis páginas existentes. O conteúdo real deve ser criado e revisado pelo editor antes de publicar.

## Pendências que exigem ambiente externo

- Instalação/login do Pages CMS GitHub App e salvar um artigo pelo editor real na branch de homologação.
- Confirmar permissões e proteção de branches/integração Cloudflare na conta do proprietário.
- Revisão e aprovação editorial das cinco pautas, autores e imagens.
- Aprovação de merge/release e, depois, smoke remoto de domínio, indexação e analytics/Search Console.
- CI remoto será exibido no PR; os resultados acima são locais, não uma afirmação de execução do CI remoto.

O repositório é público. Rascunhos são excluídos do site e do sitemap, mas os Markdown permanecem acessíveis no GitHub. Não há promessa de sigilo editorial nem controle de indexação do GitHub.
