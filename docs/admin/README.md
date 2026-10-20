# Painel administrativo CalcMot — entrega local

Atualizado em 20/10/2026. Branch `codex/admin-panel`, criada de `origin/main` (`41eb7e8`) e reaplicada por rebase sobre a main pública atual (`2f89a6d`). Sem merge, push ou nova versão publicada. CI/CD original restaurado; publicação somente por PR e merge autorizado na main.

## Estado da integração

A implementação segue o **S06 Admin Web 1.2.0**, incluindo a decisão de remover Cloudflare Access. A página de login pode ser pública; somente o backend autoriza acesso a dados e operações por Firebase ID Token, UID autorizado e claim `admin`. O frontend não contém allowlist de operadores nem regras de concessão.

O adapter real usa `/api/admin/v1`, `HttpClient`, bearer explícito, `X-CalcMot-Admin: 1`, `credentials: omit`, timeout e TransferState desabilitado. Não há fallback para fixtures no aplicativo, nem no build DEV integrado. A configuração pública oficial Firebase Web DEV foi fornecida pelo agente backend em 20/10/2026 e conectada ao adapter de autenticação. Somente os campos necessários ao Auth são usados; Analytics não é inicializado. Backend confirmou domínio OAuth e consultas autenticadas reais. O ensaio Angular same-origin permanece pendente da publicação UI autorizada; os testes do backend não substituem essa validação.

O painel exibe **Homologação DEV** desde o login e valida o ambiente retornado por `/session`. Não existe seleção de banco ou ambiente pelo operador. GETs continuam disponíveis com sessão autorizada após o prazo de recência; POSTs exigem nova autenticação quando indicada pelo serviço. Reautenticar nunca executa uma operação automaticamente: o operador precisa revisar e confirmar novamente.

## Auditoria e decisão de UI

Encontrados Angular 21.2.23, CLI 21.2.24 e TypeScript 5.9.3; standalone, SCSS próprio, Signals/RxJS e renderização híbrida. Não havia Material/CDK, ESLint, configuração Prettier nem runner de testes de componentes. O projeto já tinha QA estático e testes de calculadora. Não foi atualizado o Angular.

| Critério | Angular Material | CDK + próprios | Híbrida |
|---|---|---|---|
| Compatibilidade | Exige versão alinhada ao Angular 21 | Exige CDK alinhado | Mesma validação de peers |
| Reuso instalado | Nenhum | Nenhum | Nenhum |
| Bundle administrativo | Novos controles e tema; não medido | Primitivas seletivas; não medido | Depende dos controles selecionados; não medido |
| Tree shaking/lazy | Imports seletivos na feature | Imports seletivos na feature | Ambos podem ficar na feature |
| SSR/SSG | Exige manter o tema restrito ao admin | Sem necessidade de tema global | Requer cuidado com ambos |
| Acessibilidade | Componentes mantidos pela equipe Angular | Primitivas de comportamento, visual próprio | Benefícios seletivos |
| Teclado/foco | Comportamento pronto nos controles | Overlays/foco disponíveis | Usar onde houver complexidade real |
| Responsividade | Layout próprio ainda necessário | Layout próprio | Layout próprio |
| Identidade CalcMot | Customização de tema | Controle visual completo | Identidade própria com controles selecionados |
| Manutenção | Mais dependências sincronizadas | Dependência adicional menor | Duas estratégias de controle |
| Customização | APIs oficiais de tema, sem overrides internos | Componentes próprios | Custo de consistência entre controles |
| Custo atual | Introdução desnecessária para os controles existentes | Ainda não há overlay complexo que justifique instalar | Reservada para necessidades futuras |

**Decisão:** componentes CalcMot com controles HTML nativos nesta etapa, sem instalar Material ou CDK. O diálogo usa `showModal()`, foco contido, Escape, restauração de foco e confirmação explícita. O formulário usa Reactive Forms tipados. Material/CDK podem ser adotados seletivamente depois, quando trouxerem um comportamento necessário. Essa decisão não altera o tema do marketing.

Dependências adicionadas: `@angular/forms` alinhado ao core existente e Firebase Web, exigido pelo contrato. Wrangler 4.149.0 fixado como dependência de desenvolvimento para o pipeline existente, sem inclusão no bundle da aplicação. Sem NgRx, Module Federation, monorepo ou segunda aplicação de produção.

## Fronteiras e manutenção

- `admin.routes.ts`: lazy loading e providers restritos à feature; rotas `/admin`, `/admin/solicitacoes` e `/admin/solicitacoes/:claimId`.
- `auth/`: SDK Firebase em memória e sessão autorizada pelo backend. O SDK é preparado antes de habilitar Google para preservar a ativação do clique, especialmente em dispositivos móveis.
- `data-access/`: DTOs gerados, transporte HTTP, erros seguros e estado do workspace. `ADMIN_BACKEND` permite substituição em testes; produção sempre resolve `AdminApi`.
- `layout/`, `dashboard/`, `requests/`, `review/`, `audit/`: três containers e nove componentes de apresentação com responsabilidades reais. Apresentação não injeta API, Firebase ou autorização.
- `_admin-ui.scss`: estilos e controles compartilhados da feature. O verde reaproveita o token de marca público; não há tema global administrativo.

Os containers recebem estado por Signals. O workspace usa um pipeline `switchMap` para cancelar listagens anteriores, suprime duplicatas ativas e conserva a página visível em falhas. Respostas tardias de casos/mutações são ignoradas após saída ou invalidação. Subscriptions e timers têm cleanup; não há polling, cache global, storage de credenciais ou effects sincronizando fontes duplicadas.

O store prepara intenções imutáveis com revisão, corpo e chave de idempotência. Retry de resposta incerta conserva esses dados. Aprovação e emissão são comandos diferentes. A condição visual para mostrar emissão não calcula elegibilidade: todas as guardas continuam no backend.

### Evolução com mudanças pequenas

1. **Nova seção:** criar um container na pasta da funcionalidade e adicionar um `loadComponent` em `admin.routes.ts`. Consumir os serviços da feature; ampliar o shell somente se a navegação precisar da nova seção.
2. **Novo endpoint:** primeiro alinhar o contrato; sincronizar DTOs; adicionar a assinatura necessária em `AdminBackend` e o método HTTP correspondente em `AdminApi`. Templates nunca recebem respostas HTTP ou detalhes D1.
3. **Testar apresentação:** instanciar `ReviewFormComponent` ou `RequestsListComponent` com inputs e observar seus outputs, sem provider de backend. A suíte já contém esses exemplos. Para renderização real, o harness AOT usa os mesmos componentes e providers exclusivamente sintéticos de `tests/`.
4. **Extração futura:** a feature depende da borda HTTP, do adapter Firebase e de tokens CSS de marca. Mover a feature e recompor rotas/providers é suficiente como fronteira inicial; não é necessário Module Federation.

Sem OpenAPI fornecido, os DTOs são gerados diretamente do arquivo autoritativo do backend e verificados por AST, sem manutenção manual paralela:

```powershell
node scripts/sync-admin-contract.mjs <caminho-do-backend>/src/admin/contracts.ts
node scripts/sync-admin-contract.mjs <caminho-do-backend>/src/admin/contracts.ts --check
```

## Fluxos e limites do contrato

Login Google → sessão validada → dashboard/fila → protocolo exato/filtros/cursores → detalhes → referências e auditoria → avaliação justificada → confirmação → aprovação sem grant → confirmação de emissão → resposta autoritativa.

Há estados específicos para loading, vazio, erro recuperável, acesso negado, sessão inválida, reautenticação, conflito de revisão e resultado confirmado. A sessão é limpa ao sair da feature ou no logout. Cancelar a confirmação não dispara POST.

A API fornece três contagens (`UNDER_REVIEW`, `GRANTED`, `REJECTED`), sem contagem global separada de pendentes/aprovados e sem prioridade comercial. A UI não inventa essas métricas. A declaração textual não está no DTO atual: exibimos a indisponibilidade e as referências fornecidas. Auditoria é por caso, pois não há feed global no contrato. Referências não viram links ou previews externos.

## Isolamento público, SSR e hospedagem

As seis páginas públicas continuam prerenderizadas. Somente `admin` e `admin/**` usam CSR, conforme autorização do proprietário; nenhum dado administrativo é obtido em SSR/SSG. Não foram alterados `server.ts`, `main.server.ts` ou `angular.json`.

O admin não aparece em links públicos ou no sitemap; o gerador também o exclui. Usa `noindex, nofollow`, sem analytics/Clarity/Sentry no painel. Cruzar marketing → admin inicia um documento novo para evitar herdar trackers já carregados. O shell público é ocultado e o ajuste de viewport aplica-se somente ao body administrativo.

A documentação antiga descrevia Pages, mas a conferência remota do agente backend identificou **Worker + Assets `calcmot-site`**, builds da `main`, no domínio `calcmot.com.br`. O contrato atual não exige Access. A versão ativa `8787f096-328f-41a7-b7f7-e9e22c0ada71` foi conferida no dashboard e CLI. O corte preparado em `wrangler.jsonc` e `cloudflare/` mantém Assets/engine Angular, adapta o build neutral em workspace temporário e intercepta apenas a área administrativa, API fail-closed e shell CSR. Não faz proxy nem acrescenta binding administrativo. Detalhes e aprovação em [CUTOVER.md](CUTOVER.md). Na publicação, confirmar:

- `/admin` e filhos devem receber o shell **`index.csr.html`**, não o HTML prerenderizado da home.
- As respostas administrativas devem aplicar `Cache-Control: no-store` e `X-Robots-Tag: noindex, nofollow` no servidor/edge; `public/_headers` não comprova sua aplicação no Worker existente.
- `/api/admin/v1` e filhos devem chegar ao gateway independente, com autorização Firebase em toda chamada, sem fallback HTML, CORS aberto ou dependência de guards Angular.
- Bundles estáticos não contêm dados, UID autorizado, token ou segredo. O build padrão mantém chunks com hash na raiz; não foi criado um esquema de assets privados nem alterada a configuração de build.

## Validação e acesso local

```powershell
npm run qa:static
npm run qa:admin
npm run test:admin
npm run test:calculator
npm run build -- --stats-json
npm run qa:admin:build
```

`test:admin` executa TypeScript estrito antes dos testes. Foram validados 26 comportamentos, incluindo autorização negada, erros de token, leitura com recência antiga, confirmação explícita, cancelamento da reautenticação, revisão obsoleta, idempotência, cancelamento de filtros e respostas após invalidação. `qa:admin` verifica fronteiras e ausência de fixtures/storage/sinks inseguros na feature. Não há ESLint configurado; esses checks não são apresentados como lint ESLint. Prettier foi executado nos arquivos da feature.

O harness de teste usa somente dados sintéticos, não acessa backend real e não integra o artefato de produção:

```powershell
npm run test:admin:ui
```

Acesse `http://127.0.0.1:4311/admin` após iniciar; `ADMIN_TEST_PORT` permite outro porto. Cenários de teste: `?scenario=reauth`, `forbidden`, `empty`, `error`, `loading` e `conflict`. O botão Google nesse harness é um provider de teste, não um login real. Nunca publicar o harness. No site real, o botão é habilitado após preparar o SDK Firebase com a configuração Web DEV oficial.

As capturas em `screenshots/` usam somente fixtures. A inspeção ocorreu em Chromium desktop e viewports de 320 px, 390 px e tablet 768 px; não equivale a teste em Safari/iPhone ou Android físico. Foram conferidos fluxo de avaliação/emissão, teclado, foco, cartões mobile e overflow. A suíte de build compara H1/canonical públicos e confirma shells CSR sem HTML administrativo em acesso direto.

## Performance

Comparação reproduzível com a mesma instalação de dependências e uma cópia temporária de `origin/main`:

```powershell
node scripts/compare-admin-bundle.mjs .angular/admin-release-baseline-2f89a6d/dist/calcmot-site/browser dist/calcmot-site/browser
```

O relatório exato está em `bundle-comparison.json`. O inicial público passou de aproximadamente 485,36 kB para 440,24 kB (-9,30%); gzip calculado por arquivo passou de 155.013 para 138.705 bytes na comparação inicial. O SDK Sentry passou a carregar de forma assíncrona somente em produção pública; o relatório distingue esse custo posterior. Essa redução do inicial não significa redução do total da home com monitoramento. Firebase, telas e formulários administrativos permanecem carregados sob demanda. Fixtures são verificadas também no artefato final.

## Pendências para operação real

1. Autorizar push da branch e abertura do PR; após revisão/CI, autorizar o merge separadamente. A publicação ocorrerá pelo [pipeline automático existente](CUTOVER.md), sem deploy manual.
2. Validar no domínio oficial login proprietário/conta não autorizada, logout, sessão/reautenticação e consultas reais em desktop/mobile, sem screenshots com dados reais.
3. Conferir CSP Google/Firebase, headers e roteamento no runtime remoto; o simulador local disponível suporta compatibilidade até 13/10, enquanto o deploy preserva 19/10.
4. Safari/iPhone e Android físico ainda precisam de ensaio com operador. Não houve teste Angular same-origin antes de publicar.

Fontes técnicas consultadas: [Angular HTTP](https://angular.dev/guide/http/making-requests), [renderização híbrida](https://angular.dev/guide/ssr), [acessibilidade Angular](https://angular.dev/best-practices/a11y), [Material](https://material.angular.dev/guide/getting-started), [Firebase Auth dependencies](https://firebase.google.com/docs/auth/web/custom-dependencies).
