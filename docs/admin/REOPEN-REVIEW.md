# Reabertura de análise — correção local

22/10/2026. Base local `5015af2`; a main remota `f9d9b6a` contém o mesmo conteúdo (PR #5 integrado). Produção consultada: `9bfca9aa-816a-40ee-bba7-ed524d56ee03`, 100%. Nenhuma publicação realizada nesta correção.

## Escopo

- Detalhe REJECTED sem grant apresenta formulário “Reabrir análise”.
- O formulário reutilizado recebe modo tipado `review | reopen`. Reabertura exige justificativa, envia somente REQUEST_MORE, sem evidências selecionadas e com flags false.
- Store impede preparar decisões em GRANTED ou quando existe grant, inclusive em REJECTED; em REJECTED aceita apenas REQUEST_MORE. Trata-se de guarda de interação; backend continua autoridade.
- Confirmação, revisão, idempotência e reautenticação existentes permanecem. Nenhuma execução após reauth sem nova confirmação. Estado só muda após resposta da API.
- Sem novo endpoint, autenticação, dependência ou mudança de SSR/infra nesta correção.

## Arquivos desta correção

- src/app/admin/requests/request-details-page.component.html
- src/app/admin/review/review-form.component.ts
- src/app/admin/review/review-form.component.html
- src/app/admin/data-access/admin-workspace.store.ts
- tests/admin.spec.ts

Diff isolado disponível em `.angular/admin-reopen-review.patch`. Outras alterações locais anteriores de Firebase/preview/documentação foram preservadas e não pertencem a esta correção.

## Validação

QA estático e arquitetural passaram. TypeScript estrito e 30 testes administrativos passaram, incluindo cancelamento, reabertura, recência/reauth sem replay, preservação da intenção e ausência de grant. Casos GRANTED e REJECTED com grant não preparam decisão. Build passou, com seis páginas prerenderizadas; verificação SEO/canonical/sitemap e diff --check passaram.

Inspeção visual local concluída pelo agente backend em 22/10/2026, conforme registro abaixo. Pendente: ensaio real depois de publicação autorizada pelo fluxo oficial. Não houve teste de escrita remoto, push, merge ou deploy. A main atual tem uma falha de CI GA4 (evento home→calculadora ausente); não foi corrigida nem escondida por esta alteração.

## Preview local — reabertura de análise

Servidor sintético AOT iniciado em 22/10/2026, porta 4312, somente 127.0.0.1. Sessão de terminal 61710. Não publicar este harness.

### URLs para inspeção

- Recusado sem grant: http://127.0.0.1:4312/admin/solicitacoes/DEMO-2026-1042
- Concedido com grant: http://127.0.0.1:4312/admin/solicitacoes/DEMO-2026-1043
- Recusado com autenticação recente expirada simulada: http://127.0.0.1:4312/admin/solicitacoes/DEMO-2026-1042?scenario=reauth

O botão Google neste protótipo usa provider de teste; não abre autenticação real. Todas as operações ocorrem somente nas fixtures em memória do browser. /api/* local é bloqueado com 403. Recarregar reinicia o caso sintético. Não são utilizados tokens, contas ou dados pessoais reais.

### Roteiro visual

1. No caso recusado, iniciar sessão sintética se necessário. Conferir “Reabrir análise”, justificativa obrigatória e ausência de select de aprovação/recusa e checkboxes de avaliação.
2. Preencher justificativa sintética, escolher “Revisar reabertura”. Conferir protocolo, revisão, REQUEST_MORE (Solicitar complementação), justificativa, zero evidências e checkbox explícito no diálogo existente.
3. “Voltar” cancela sem alterar caso. Confirmar no protótipo muda a fixture para UNDER_REVIEW e acrescenta evento, sem grant.
4. Com scenario=reauth, confirmar identidade simulada não executa a ação; é necessária confirmação posterior.
5. No caso concedido, conferir “Direito emitido” e ausência da ação de reabrir.

### Estado

Preview compilado com sucesso. Inspeção visual local concluída pelo agente backend em 22/10/2026; resultados reportados abaixo. A correção local passou QA estático/arquitetural, 30 testes administrativos e build com seis páginas SSG. O adapter sintético foi ajustado somente para refletir REQUEST_MORE→UNDER_REVIEW na memória do protótipo.

Demais alterações preexistentes foram preservadas. Não houve push, merge, deploy, login real ou escrita no backend. Diff e escopo da correção: REOPEN-REVIEW.md.



### Inspeção visual local reportada pelo agente backend — 22/10/2026

- DEMO-2026-1042: formulário Reabrir análise com justificativa e sem seletor de resultado.
- Cenário reauth: diálogo legível; após identidade simulada, checkbox desmarcado e botão Registrar avaliação desabilitado. Nenhuma execução automática.
- Voltar cancela e preserva REJECTED na revisão 0.
- DEMO-2026-1043: GRANTED sem ação de reabertura.
- Screenshot de fixture informado pelo agente: `C:/Users/426174/Documents/code/CalcMot/.tmp/admin-final-qa/reopen-local-reauth-confirmation.png`. Não foi capturado ou reinspecionado por este agente.

Essa evidência é de protótipo local sintético, não de operação remota. Aprovação de push/PR da correção ainda pendente; merge e publicação permanecem separados. Nenhuma alteração GA4 faz parte desta correção.
