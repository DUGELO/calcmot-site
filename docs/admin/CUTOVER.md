# Publicação do painel Admin DEV pelo fluxo normal

Atualizado em 20/10/2026. A estratégia vigente é **PR de `codex/admin-panel` para `main`, merge somente autorizado e deploy automático do Worker existente**. Não há publicação manual paralela.

## CI/CD restaurado

Configuração conferida após salvar e recarregar o dashboard:

- Repositório: `DUGELO/calcmot-site`; branch de produção `main`.
- Builds habilitados; build `npm run build`; publicação `npx wrangler deploy`; raiz `/`.
- Nenhum repositório desconectado, outro projeto alterado ou build desabilitado.
- A troca temporária para `versions upload` foi revertida. O upload manual foi interrompido; a lista de versões confirmou que nenhuma versão nova foi criada. Produção permanece em `8787f096-328f-41a7-b7f7-e9e22c0ada71`.

A evidência visual está em `screenshots/cicd-restored.jpg`; o registro sanitizado está em `remote-validation.json`.

## Conteúdo do PR

Base atual `origin/main` **2f89a6d**, preservando os PRs públicos integrados. Feature standalone/lazy `/admin`, Google Firebase Web oficial e contrato S06 **1.2.0**. A API relativa `/api/admin/v1` usa ID Token em memória; não há dados sintéticos no artefato integrado, autorização no frontend, Analytics administrativo ou concessões locais de direitos.

`wrangler.jsonc`, `cloudflare/` e `scripts/build-cloudflare.mjs` tornam explícita a adaptação neutral que o Wrangler já fazia para Angular. O build acontece em workspace temporário; não modifica `src/server.ts`, `main.server.ts` ou `angular.json`. O Worker mantém o engine Angular público e ASSETS; somente admin/API/shell CSR passam antes dos assets. Os dois custom domains existentes são declarados, com workers.dev/previews mantidos para o site público. Nessas origens alternativas, `/admin` recebe 404.

- `/admin` e subrotas entregam `index.csr.html`, sem dados privados no HTML, com no-store/noindex e CSP específica.
- As seis páginas públicas continuam prerenderizadas e indexáveis; canonical e trailing slash preservados.
- `/api` no Worker público falha com JSON 404, nunca fallback HTML. As rotas específicas já existentes continuam no gateway DEV, sem novo Service Binding no site.
- Aprovação e emissão permanecem separadas; reautenticação não repete operações automaticamente. O aviso Homologação DEV aparece desde o login.
- Assets oficiais e tokens visuais do site são reutilizados. Material não foi adicionado. Formulários e Firebase ficam nos chunks lazy.

## Integração com o pipeline existente

O dashboard continua executando os mesmos comandos: `npm run build` seguido de `npx wrangler deploy`. O Wrangler **4.149.0** está fixado como dependência de desenvolvimento, para que o comando existente use a versão validada. O hook versionado `build:cloudflare` gera `dist/calcmot-cloudflare/{browser,server}` e o binding ASSETS publica somente `browser`.

O GitHub Actions mantém os testes públicos/mobile/analytics e adiciona testes administrativos, empacotamento `--dry-run`, paridade dos dois builds e roteamento workerd. O workflow não publica produção. O antigo deploy opcional em Pages foi retirado; continua disponível o artifact do PR, sem segunda solução de hospedagem.

## Validação

QA estático/arquitetural, TypeScript estrito, 26 testes administrativos, roteamento edge, calculadora, atribuição, builds padrão/neutral, H1/canonical/sitemap e ausência de fixtures passaram localmente. O PR inclui os checks para repetição no CI. Medição em `bundle-comparison.json`: inicial público 485,36 → 440,24 kB; o custo posterior do Sentry é distinguido dessa medida.

O workerd local disponível suporta até 13/10; o teste usa essa data explicitamente, enquanto a configuração real preserva 19/10. Empacotamento dry-run mantém a data de produção. O teste local não equivale a homologação Angular same-origin.

## Depois do PR

1. Com autorização específica, fazer push somente da branch e abrir o PR. Ainda não houve push ou PR remoto.
2. Aguardar CI e revisão. **Não fazer merge sem autorização explícita.**
3. Após merge autorizado, acompanhar exclusivamente o deploy automático da main. Reconfirmar a versão imediatamente anterior como rollback; `8787f096-328f-41a7-b7f7-e9e22c0ada71` é apenas o baseline atual, não uma suposição permanente.
4. Homologar no domínio oficial: proprietário, conta negada, logout, reautenticação, GETs de sessão/contagens/lista/detalhes/evidências/auditoria; desktop/mobile; CSP/popup, headers, aliases e regressões públicas.

Nenhum POST administrativo de negócio, cadastro de evidência, aprovação, recusa ou emissão faz parte da homologação. Não mudar D1, claims, IAM, gateway, billing ou Access. Não capturar dados reais ou credenciais em logs/screenshots.

## Risco e rollback

O PR altera o Worker que serve o site. Os testes preservam Assets-first público e restringem CSP/DEV/no-store à administração. CSP/popup Google e sessões reais só serão atestados após o deploy automático. O pipeline normal não deve ser pausado.

Em regressão crítica após publicar, restaurar a última versão saudável com seus assets pelo rollback do Worker e preparar um revert do PR para evitar que um build futuro reintroduza o erro. Qualquer merge/revert segue autorização do proprietário. O rollback do site não remove nem altera o backend DEV.
