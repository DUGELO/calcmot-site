# Preparação frontend DEV / PROD — somente local

Atualizado em 23/10/2026. Implementação local preparada e validada. **Merge, deploy, alteração do pipeline e cutover não estão autorizados nesta etapa. O push exclusivo da branch e a abertura do PR foram autorizados diretamente pelo proprietário em 23/10.** O site oficial continua na versão DEV homologada; os arquivos abaixo ainda não foram publicados.

## Estado DEV já homologado

https://calcmot.com.br/admin — commit main a956ec8, Worker 1940ff84-5711-4e20-8e2d-f99febca7978 (baseline confirmado em 22/10). Homologação operacional de 22/10 concluída: caso sintético negativo REQUEST_MORE 1→2, referência AUXILIARY 2→3 e REJECT 3→4; reautenticação Google real sem replay, cancelamento e logout/reload sem dados privados. Nenhum grant novo. Relatório: FINAL-OPERATIONAL-QA.md.

## Environments e seleção explícita

| Arquivo | Alvo administrativo | Escrita frontend |
| --- | --- | --- |
| src/environments/environment.ts | DEV, local/default | Permitida somente com sessão DEV válida |
| src/environments/environment.staging.ts | DEV, staging explícito | Permitida somente com sessão DEV válida |
| src/environments/environment.production.ts | PROD | Sempre desativada nesta preparação |

angular.json ganhou somente as configurações aditivas admin-staging/admin-production, com fileReplacements do environment.ts. As configurações públicas production/development e defaultConfiguration=production foram preservadas. O nome production do build de otimização Angular **não seleciona por si só o backend PROD**: npm run build continua ng build e usa environment.ts/DEV. Isso preserva o autodeploy existente enquanto o gateway oficial ainda atende DEV.

Comandos locais, sem publicação:

```powershell
npm run build                 # fluxo atual: otimização production, admin DEV
npm run build:admin:dev        # production,admin-staging → dist/calcmot-admin-dev
npm run build:admin:prod       # production,admin-production → dist/calcmot-admin-prod
npm run test:admin:environment
npm run qa:admin
npm run test:admin
```

O build do Worker usa scripts/admin-build-environment.mjs. Sem CALCMOT_ADMIN_ENVIRONMENT, seleciona explicitamente DEV/admin-staging. Somente DEV ou PROD exatos são aceitos; vazio, minúsculas, valores desconhecidos e URLs são recusados antes do build. O helper aplica a configuração Angular correspondente e gera dist/calcmot-cloudflare/admin-environment.mjs, consumido pelo Worker para que o header do shell corresponda ao mesmo artefato. Nenhum binding privado foi adicionado ao site.

Exemplo de **preparação local**, não de deploy:

```powershell
$env:CALCMOT_ADMIN_ENVIRONMENT='PROD'
npm run build:cloudflare
Remove-Item Env:CALCMOT_ADMIN_ENVIRONMENT
```

O comando remoto original permanece npm run build seguido de npx wrangler deploy. Nenhuma variável remota foi criada/alterada. Num corte futuramente autorizado, a seleção do hook final do Worker precisa ser PROD; o primeiro build padrão permanece intermediário DEV e não é o diretório de assets publicado pelo Wrangler. Não usar build:admin:prod como sinônimo de publicar ou mudar rotas. O último dry-run local desta preparação foi regenerado em DEV, sem deixar o alvo padrão como PROD.

## Identidade, API e banco

A API permanece relativa /api/admin/v1, sempre same-origin; nenhuma URL DEV é usada como fallback PROD. Nenhum hostname é inferido para selecionar ambiente e não há seletor por query/localStorage. A query prod-readonly existe exclusivamente no protótipo sintético em tests/, nunca na aplicação integrada.

Firebase Web público existente é compartilhado conforme coordenação backend: projeto calcmot, sem inventar appId, app PROD, UID de proprietário, secrets ou claims. Seus campos públicos permanecem centralizados em auth/admin.config.ts, sem replicá-los nos três environments. O Firebase autentica; o ambiente do D1 é definido exclusivamente pelos Workers/bindings backend. O domínio oficial ou o projeto Firebase isoladamente não identificam DEV/PROD do banco.

## Contrato e bloqueios implementados

- admin.contracts.ts foi gerado da fonte oficial backend/src/admin/contracts.ts atualizada para 1.3.0, com environment DEV|PROD e mutationsEnabled:boolean.
- admin.models.ts isola a compatibilidade de leitura com 1.2.0: somente sessão DEV, configurada explicitamente DEV, sem campo mutationsEnabled. PROD exige 1.3.0 e flag booleano válido; versões/ambientes ausentes, inválidos ou divergentes são recusados. Não editar o DTO gerado à mão.
- Cada resposta HTTP, inclusive erro HTTP com status, precisa ter X-CalcMot-Environment exatamente igual ao alvo. Divergência invalida sessão, limpa dados/intenção e impede apresentação do resultado. Falha de rede sem resposta permanece recuperável.
- Cada POST inclui X-CalcMot-Expected-Environment com o alvo configurado, além de bearer, marcador administrativo, revisão e idempotência. Não é segredo nem substituto da autenticação.
- O backend 1.3 coordenado deve verificar o alvo atomicamente antes de D1; o header de resposta sozinho só permitiria detectar erro depois da operação. Não foi adicionada consulta de sessão redundante antes de cada POST.
- Configuração + sessão devem permitir escrita. Em 1.3, mutationsEnabled=false permite leitura mas bloqueia operações. PROD continua bloqueado no transporte, store e UI **mesmo se uma configuração local tentar mutationsEnabled=true**; ativação comercial exige escopo e alteração posteriores.
- Intenção pendente é cancelada se escrita ficar indisponível; reauth não reenvia operação. Não há form de avaliação/evidência, reabertura ou botão de emissão no modo somente consulta.
- O banner identifica o destino configurado desde o login. A sessão precisa validar esse destino antes de liberar dados; não troca automaticamente para seguir a resposta do serviço.

Esses controles frontend não autorizam acesso ao banco. Segurança de abas antigas, binds divergentes e política comercial depende das validações independentes do gateway/Worker privado. Backend DEV 1.2 remoto tolera o novo header; PROD 1.3 exige o header correto. A compatibilidade futura precisa ser homologada no corte, sem importar grants DEV.

## Arquivos desta preparação

- src/environments/environment{,.staging,.production}.ts e configurações aditivas em angular.json.
- auth/admin.config.ts, auth/admin-environment.ts e auth/admin-session.service.ts.
- data-access/admin-api.service.ts, admin.contracts.ts, admin.models.ts e admin-workspace.store.ts.
- admin.component.ts/html e requests/request-details-page.component.html para identificação e modo somente consulta.
- scripts/admin-build-environment.mjs, build-cloudflare.mjs, qa-admin.mjs e verify-admin-workerd.mjs.
- cloudflare/worker.mjs e admin-routing.mjs: ambiente do header gerado junto com os assets; roteamento público/privado preservado.
- scripts novos em package.json e testes admin.spec.ts, admin-build-environment.spec.mjs, admin-edge.spec.mjs e admin-prototype.ts.

Não foram alterados src/server.ts, main.server.ts, app.routes.server.ts, workflows, DNS, backend, D1 ou configuração remota. As alterações anteriores de Firebase/overrides/lockfile e documentação foram preservadas; **não pertencem à seleção de ambientes** e não devem entrar inadvertidamente num futuro PR. Nenhuma dependência nova é necessária para esta preparação.

## Validação concluída

Em 22/10, com o diff funcional final:
- QA estático/arquitetural e TypeScript estrito: PASS.
- 41 testes administrativos: PASS, incluindo matriz de contratos, headers, alvo desconhecido, read-only e limpeza de estado.
- Teste de seleção/fileReplacements/default DEV e rejeição de alvo inválido: PASS.
- Testes edge: PASS, incluindo header PROD e rejeição de ambiente inválido.
- Build padrão DEV e build explícito PROD: PASS; seis páginas prerenderizadas em ambos, sem conteúdo privado prerenderizado.
- Verificação de SEO/sitemap/canonical e paridade das seis páginas entre DEV e PROD: PASS.
- Empacotamento Wrangler --dry-run e workerd/Assets locais para PROD e DEV: PASS, sem chamadas a backend remoto. O último artefato é DEV. Runtime local usa data compatível 13/10; configuração publicada preserva 19/10.
- Bundle inicial padrão aproximadamente 440,25 kB, contra 440,24 kB da base anterior; sem aumento relevante do inicial público. Feature e Firebase continuam lazy.
- Preview sintético PROD somente consulta inspecionado: banner correto, evidências desabilitadas e ausência de formulários de escrita/emissão. Captura screenshots/local-prod-readonly.jpg; não é PROD real.

Em 23/10, apenas a integração final do guardrail foi retomada: qa:admin agora também executa o teste de seleção. Comando combinado, correspondência dos DTOs oficiais e diff --check passaram. Não houve alteração funcional depois dos builds que justificasse repeti-los.

Preview sintético local preparado em http://127.0.0.1:4313/admin/solicitacoes/DEMO-2026-1042?scenario=prod-readonly ; pode precisar ser reiniciado com ADMIN_TEST_PORT=4313 e npm run test:admin:ui após reinício da máquina. Não usar esse harness para dados reais nem publicar.

## Corte e rollback ainda não executados

Fonte de coordenação: docs/integration/S06-ADMIN-PROD-CUTOVER.md no repositório backend. O backend informou recursos PROD privados, banco vazio, mutações OFF e sem rotas públicas; isso não é uma homologação HTTP PROD feita pelo frontend. As duas rotas oficiais continuam DEV. Não há URI pública PROD adicional para inventar/testar.

Aguardar aprovação e plano final para PR/publicação coordenada, seleção do artefato e troca das duas rotas gateway. Publicar frontend esperando PROD enquanto o gateway ainda é DEV bloqueia corretamente o login, portanto não realizar essa troca isolada. Rollback deve restaurar o par frontend + rotas/gateway do mesmo ambiente; restaurar só calcmot-site não troca o banco da API. Não restaurar banco nem desfazer grants por iniciativa frontend. A ativação de operações comerciais não faz parte desta preparação.

**Resultado:** preparação local completa, default DEV preservado, PROD preparado somente leitura, nenhuma publicação nem concessão nova. Homologação real PROD e corte permanecem etapas futuras coordenadas e autorizadas separadamente.

## Readiness para PR — 23/10/2026

Autorizado versionar esta preparação em branch própria e abrir PR, sem merge/deploy/cutover. Base conferida origin/main a956ec8. A seleção efetiva de PROD e a publicação deverão constituir uma única janela coordenada com as duas rotas API; não são acionadas por este PR.

### Procedimento único proposto, ainda não executável sem aprovação

1. Fixar SHAs dos PRs frontend/backend e registrar versões/rotas atuais e baseline DEV. Validar os recursos PROD isolados, política de acesso e gates de escrita OFF; não importar dados DEV.
2. Aprovar a janela e a seleção CALCMOT_ADMIN_ENVIRONMENT=PROD para o hook final do build do Worker; preservar os comandos npm run build e npx wrangler deploy. Publicação somente após merge explicitamente autorizado pelo fluxo automático existente.
3. Coordenar essa publicação com a transferência exclusivamente das duas rotas /api/admin/v1 e /api/admin/v1/* para o gateway PROD. Enquanto artefato e API divergirem, login deve falhar fechado. Não remover as guardas para esconder a indisponibilidade transitória; o site público continua independente.
4. Conferir versão/commit efetivamente publicados, cabeçalho PROD, sessão 1.3/PROD/mutationsEnabled=false, dados PROD sem fixtures e negativos de autorização. Abas DEV antigas precisam ser recusadas pelo header esperado validado no backend antes de D1. Nenhum grant de smoke test.
5. Manter frontend e backend somente leitura. Política comercial e ativação de escrita são etapas separadas, com autorização própria e canal seguro validado.
6. Em falha, gates de escrita permanecem OFF. Restaurar versão/configuração compatível com o mesmo ambiente e banco; retorno a DEV somente por decisão explícita e conjunta de frontend e rotas, nunca por fallback automático nem rollback destrutivo do banco.

### Canal de sessão da política PROD: bloqueio específico

Inspeção somente de código, sem ler credenciais ou executar --apply: backend/scripts/bootstrap-admin-prod-policy.mjs existe, valida destino PROD/gates OFF e consome sessão Firebase legítima por stdin antes de authorizePolicy. O script não autentica Google nem fornece por si só um produtor confiável da sessão recente. As ferramentas s06-dev-session/console existentes são do fluxo DEV; não foram reapontadas ou tiveram guardas removidas. Não foi confirmado um canal PROD completo já implementado que produza essa sessão sem USB, token em chat/clipboard/arquivo ou extração do browser. Portanto registro da política PROD continua bloqueado nessa etapa, a ser resolvido pelo responsável backend; não há novo endpoint/auth no frontend nem nova política inserida por este trabalho.

A homologação DEV de 22/10 está concluída em registro local separado FINAL-OPERATIONAL-QA.md; suas capturas reais e alterações documentais antigas não integram este PR de ambientes.

### Estado GO/HOLD de readiness

- GO local: arquivos de ambiente e seleção, compatibilidade 1.3/DEV1.2, bloqueios/read-only, 41 testes, QA/builds/SEO e dry-run locais comprovados.
- HOLD para corte/merge: nenhuma autorização de merge/cutover nesta ordem; exige revisão conjunta frontend/backend e janela coordenada.
- HOLD para política PROD: consumidor privado por stdin implementado; produtor legítimo de sessão recente não confirmado. Sem token em chat/clipboard/arquivo, extração de browser ou dependência USB.
- PR frontend: https://github.com/DUGELO/calcmot-site/pull/7, branch codex/admin-environments, 27 arquivos, sem dependências/lockfile/workflows. Push e abertura autorizados diretamente pelo proprietário neste chat.
- Lighthouse, Site CI e preview Cloudflare do PR #7 devem ser aprovados no head atual antes de considerar o PR pronto; não confundir com os checks do PR #6 já publicado.

Autorização direta de push de codex/admin-environments e abertura do PR recebida neste chat após o bloqueio acima. Não inclui merge ou publicação.
