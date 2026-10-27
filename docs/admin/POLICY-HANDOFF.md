# Registro privado da política PROD

Branch local: `codex/admin-policy-handoff`, baseada em `origin/main` b420089.
Sem publicação, alteração de gates ou operação real nesta implementação.

Atualização de escopo autorizada: o build PROD permite operações apenas quando
uma sessão compatível do backend retorna `mutationsEnabled:true`. O bloqueio
anterior fixo em DEV foi removido; build desativado, sessão false/incompatível e
autenticação antiga continuam bloqueando o fluxo. Banner distingue acesso restrito,
somente consulta e operações autorizadas. Nenhum gate backend foi alterado.

## Fluxo

1. A ferramenta privada escuta somente `127.0.0.1:8971` e oferece o link
   `https://calcmot.com.br/admin#policy-bootstrap=8971.<noncehex64>`.
2. O frontend remove imediatamente esse fragmento do histórico. Somente origem
   oficial, entrypoint `/admin` e build PROD aceitam o fluxo. Nenhum request é
   automático. Login e autorização administrativa continuam pelo Firebase/API.
3. O operador seleciona **Conectar à ferramenta privada**. POST `/challenge`
   contém apenas `{nonce}`. Exige resposta com `protocolVersion:1`, ambiente PROD,
   política `legacy-through-3.5-vc12` e `grantsWritten:0`.
4. O operador marca a confirmação e clica em **Confirmar identidade com Google e
   registrar política**. Reautenticação pelo SDK existente; sessão conferida pela
   API. Somente depois o SDK produz o ID Token em memória.
5. POST local `/bootstrap` contém `{nonce,token}`, sem cookies, cache, referrer ou
   redirects. Nenhum endpoint público de bootstrap foi criado. Receiver e script
   privado continuam autoridades de assinatura, proprietário, recência e destino.
6. A interface apresenta sucesso somente com recibo validado: `policyOnly:true`,
   PROD, política correta, `grantsWritten:0`, operationId e data confirmada. Retém
   somente os três campos sanitizados apresentados. Nenhum grant é solicitado.

Desafio frontend expira em dois minutos; receiver expira conforme seu próprio
TTL. Cancelamento/logout/destruição limpa nonce e aborta fetch pendente.
Duplo clique, falha de rede e recibo inválido não repetem o bootstrap. Se o POST
já foi iniciado e o resultado for incerto, conferir o recibo privado antes de uma
nova intenção; abortar a conexão não garante desfazer a operação no receiver.

## Fronteiras

- `AdminPolicyBootstrap`: estado e integração do fluxo privado, separado de
  `AdminApi` e do store de solicitações; sem regras de elegibilidade ou emissão.
- `PolicyBootstrapPanelComponent`: tela específica coordenando essa única ação.
- CSP permite `http://127.0.0.1:8971` somente no shell `/admin` e `/admin/` PROD.
  DEV, subrotas, aliases e páginas públicas não recebem essa exceção. COOP,
  referrer, configuração Firebase, SSR e pipeline permanecem preservados.
- O link não autentica o receiver por certificado: nonce é uma capacidade de uso
  único gerada pela ferramenta confiável. Não abrir links de ferramentas locais
  desconhecidas. Código malicioso no computador não é contido por esse canal.

## Validação

- Testes administrativos sintéticos: captura/remoção do fragmento, origem e porta
  fixas, DEV bloqueado, desafio sem token, consentimento, reautenticação antes do
  token, expiração, logout, duplicidade, falha de transporte, recibo inválido e
  sucesso somente autoritativo; sem token real.
- Testes edge: exceção CSP PROD entrypoint, sem exceção nas subrotas; guardrails
  arquiteturais, QA estático, build padrão/PROD e seis páginas prerenderizadas.
- Ensaio real ainda necessário: CORS/PNA/Local Network Access no navegador do
  proprietário; popup Google; desafio real; recibo do script. Não foi executado
  registro de política para validar o código local.

## PR preparado

Título: `feat(admin): confirmar política PROD por ferramenta privada local`

O painel passa a reconhecer links de uma ferramenta privada de registro da
política. O operador conecta, confirma explicitamente e reautentica pelo Firebase
existente antes do envio local. A interface só reconhece sucesso após recibo
confirmado, sem emitir direitos. Inclui testes de falhas e restrição CSP na porta
fixa, somente no entrypoint administrativo PROD.

Não incluir no PR alterações locais anteriores de dependências, lockfile,
relatórios de homologação ou screenshots reais. Push/abertura/publicação pendentes
da revisão coordenada e das autorizações aplicáveis. Nenhum pipeline alternativo.
