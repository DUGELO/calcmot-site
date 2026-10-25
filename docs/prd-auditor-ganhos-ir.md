# PRD — CalcMot Auditor de Ganhos e IR Facilitado (MVP gratuito)
**Status:** implementação para homologação, SEM autorização para lançamento. **Data:** 24/10/2026. **Stack verificada:** Angular 21, SSR/SSG, Cloudflare Worker, `cloudflare/admin-routing.mjs`, analytics GA4/Clarity. **Branch:** `feat/auditor-ganhos-ir-mvp`.

## Problema e público
Motoristas Uber no Brasil precisam conferir demonstrativos, taxas e saldo financeiro, mas PDFs diferem por versão. A IA interpreta documentos, porém não pode inferir valores ou base fiscal que o documento não fornece.

## Objetivo e métricas
Disponibilizar auditor gratuito PDF Uber → extração automática → conferência excepcional → painel/exportação CSV, sem cadastro obrigatório **desde que o processamento seja efêmero**. Métricas agregadas sem PII: visita, upload iniciado, extração concluída, pendência, relatório exportado. Metas de ativação e custo ainda são hipóteses, não promessas.

## Descobertas fiscais e barreiras legais
**CORREÇÃO CRÍTICA:** o briefing original dizia 20% tributável/80% isento para transporte de passageiros. A Receita Federal confirma **no mínimo 60% tributáveis e até 40% não tributáveis** para pessoas físicas que atendam às condições previstas. **Não usar 20/80.** A base tem de representar **rendimentos brutos elegíveis do transporte de passageiros**, não o repasse bancário ou simples total de um PDF quando não há evidência da equivalência.
- Receita Federal: https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/pagamento/carne-leao/rendimentos/
- Receita: Manual da Declaração 2026: https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/preenchimento/manual-mir/rendimentos/rendimentos-do-trabalho
- Fonte 2026: https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/perguntas-e-respostas/dirpf/p-r-irpf-2026-v1-00-2026-04-23.pdf

**Proteção fiscal:** emitir prévia 60/40 exclusivamente se pessoa física confirmar elegibilidade, ano-calendário 2025 ou 2026 (mesma regra legal 60/40 para transporte de passageiros) e base bruta validada. É simulação não vinculante, não apura DARF, não escolhe código de ficha, não transmite declarações. Se PDF não distinguir bruto/passagens, mostrar pendência. MEI, MEI Caminhoneiro, rendas diversas e cálculo do imposto devido permanecem fora do motor fiscal até validação normativa separada. Para 2026, somente a separação indicativa 60/40 é calculada; tabelas, redução de IR, Carnê-Leão e DARF continuam pendentes. Impostos pessoais do motorista exigem verificar outras rendas, deduções, fonte pagadora e períodos com profissional habilitado.

## Requisitos e fluxos
R1: upload de **um PDF por vez, até 4 MiB**, tipo MIME e magic bytes verificados no cliente e Worker, bloqueando arquivos ambíguos. Processar até quatro sequencialmente na sessão; sem filas/persistência antes de comprovar volume.
R2: Gemini no backend (segredo `GEMINI_API_KEY`, nunca cliente), `responseMimeType: application/json`, campos obrigatórios de esquema, texto PDF como dado não confiável, timeout. Não usar IA para regra fiscal.
R3: resposta canônica com proveniência por campo, valor ausente como null, números monetários em centavos; não tolerar valor de origem não identificável.
R4: esquema/verificação de taxas e repasse, duplicatas SHA-256, sobreposições sinalizadas. Documentos inconsistentes e duplicados não entram no consolidado sem resolução.
R5: exibir totais de taxas, repasses e categorias com distinção entre faturamento bruto demonstrado e valor efetivamente recebido. Não chamar saldo de lucro se custos do veículo não forem apurados.
R6: botão CSV para relatório e botão apagar sessão. Arquivos nunca são enviados ao GA4.
R7: IR prévio condicionado ao bruto comprovado, pessoa física e anos 2025/2026. Nunca exigir revisão campo a campo quando documento for consistente.
R8: interface mobile-first, contrastes, estado de erro/progresso, acessibilidade e informações de privacidade.
R9: backend protegido por Cloudflare Turnstile **validado no servidor** e Cloudflare Rate Limiting binding. Se segurança/segredo não estiver configurado, fail closed (503) — não liberar endpoint público desprotegido.

## Arquitetura
Angular route `/ferramentas/auditor-ganhos-ir`; componente lazy, dados apenas em memória. Worker intercepta **exclusivamente** `POST /auditor-interno/analisar` antes de delegar ao gateway/Admin/SSR. Não abrir `/api/*`: esse namespace pertence ao gateway existente e permanece com fail-closed 404. Gemini REST API via `generateContent` com PDF inline por base64 (documentos pequenos); payload descartado no fim do request. Sem database/R2/Queue, sem persistência de comprovantes. Não é necessário logar para testar a funcionalidade, pois não existe histórico no servidor. Caso se adote histórico posteriormente, autenticação e isolamento passam a ser obrigatórios.

Variáveis: `GEMINI_API_KEY`, `TURNSTILE_SECRET_KEY`; binding `AUDITOR_RATE_LIMITER` com limite por IP via Worker. Preview sem segredos deve falhar seguramente e permitir simulação com fixtures locais apenas nos testes.

## Modelo de dados (sem CPF)
`report`: `platform`, `documentType`, `periodStart`, `periodEnd`, `grossPassengerCents`, `platformFeeCents`, `driverPayoutCents`, `tipsCents`, `incentivesCents`, `reimbursementsCents`, `kilometers`; cada valor não confirmado é null. `evidence`: frase curta do PDF para apoiar revisão; nunca copiar para telemetry. `issues`: código enumerado e rótulo local; `documentHash`: SHA-256 calculado em memória no navegador; `confirmed`: true quando sem inconsistência.
`tax`: `taxYear`, `grossBaseCents`, `minimumTaxableCents`, `maximumNonTaxableCents`, `status`. Toda conta em centavos.

## Restrições e adversários
PDF malicioso, PDF com prompt injection, PDF enorme, abusos anônimos, conteúdo sensível de passageiros e cobrança descontrolada: validar magic bytes e tamanho; não reter originais; não instruir o modelo a seguir textos do PDF; não refletir prompts/respostas em logs; limitar requisições, 1 PDF/request e orçamento no console do fornecedor. Apenas segredo de backend com Turnstile e limiter; não confiar em header IP arbitrário fora do Cloudflare. Deve haver revisão de termos LGPD e consentimento separado antes da liberação.

## Critérios e testes
T1: testes do motor determinístico: 60/40 de base inteira, arredondamento sem perda, ausência de bruto gera bloqueio fiscal, PF/MEI/ano não elegível bloqueados e ano do documento deve coincidir.
T2: testes do validador: enums, valores ausentes, negativos, datas inválidas, inconsistência contábil.
T3: Worker: POST apenas, magic PDF, limite tamanho, Turnstile, segredo indisponível, timeout e erro do provedor, origem e no-store, sem fuga de /api.
T4: testes do fluxo Angular em CI: upload, erro, revisão, exportação, exclusão, layout mobile; não simular Gemini pago como validação real.
T5: regressão: `npm run qa:static`, `npm run test:calculator`, `npm run test:analytics`, build+prerender, Wrangler dry run e QA browser.
T6: teste Gemini com PDF real autorizado e credenciais de ambiente deve ser executado antes de habilitar produção; sem credenciais reportar bloqueio, não sucesso.

## Matriz de rastreabilidade
| Req | Fonte | Módulo | Teste | Aceite |
|---|---|---|---|---|
| R1/R2 | Gemini PDFs oficial | `cloudflare/auditor-*.mjs` | unit/edge | validação + resposta |
| R3/R4 | evidência documental | `cloudflare/auditor-core.mjs` | unit | fail closed |
| R5/R6 | usuário | Angular auditor | CI + UX | CSV e exclusão |
| R7 | Receita Federal citada | `cloudflare/auditor-core.mjs` | fiscal | 60/40 e bloqueios |
| R8/R9 | minimização LGPD | Worker/Angular | edge/smoke | segredo e rate limit |

## Implantação, rollback e pendências
**NUNCA** publicar diretamente: abrir PR draft, CI, revisão de provas PDF Uber (com dados anonimizados), revisão fiscal por contador, auditoria de segurança, secret/binding Turnstile + Gemini, limites de orçamento e aceite da política de privacidade. Rollback via revert do merge e remoção dos bindings (sem dados persistidos). Para ativação real verificar consumo, limites e falhas em produção por amostragem; somente com autorização.


## Incremento de 25/10/2026 — rastreabilidade e segurança
- Evidência: Receita Federal, regra legal 60/40 do transporte de passageiros; hipótese: valores apresentados como base bruta em versões diferentes do relatório Uber podem variar semanticamente. A interpretação da IA não substitui a validação da origem dos valores.
- `documentType='earnings_statement'` agora é obrigatório e validado. Campos essenciais com valor monetário e evidência vazia seguem para revisão localizada; CPF e emails que apareçam na evidência são redigidos antes da resposta.
- Regras versionadas `PF_PASSENGER_TRANSPORT_2025_60_40` e `PF_PASSENGER_TRANSPORT_2026_60_40`: separação de parcelas somente, sem cálculo de imposto. Relatórios fora do ano escolhido não entram nessa prévia.
- Não considerar as pontuações de confiança sugeridas na pesquisa como precisão empiricamente validada: enquanto não houver corpus real validado, critério de evidência + coerência controla apenas o fluxo determinístico.
- Lacunas honestas frente ao produto-alvo: comprovantes não são persistidos, consolidação é só da sessão, ausência de fila e de login; não há PDF de saída, controle automático de despesas operacionais ou modelo fiscal completo. Necessário E2E real e corpus autorizado antes de produção.

| Requisito | Evidência | Regra | Implementação | Teste | Aceite |
|---|---|---|---|---|---|
| Identificar formato | Gemini estruturado | Não aceitar tipo desconhecido | `auditor-api.mjs`, `auditor-core.mjs` | `test-auditor.mjs` | rejeitar documento sem tipo comprovado |
| Proteger dados | LGPD minimização | Remover CPF/email de evidência retornada | `auditor-core.mjs` | `test-auditor.mjs` | não revelar padrão CPF/email |
| Fiscal por ano | Receita 60/40 | Apenas PF elegível, ano coerente | `auditor-core.mjs`, `auditor-ganhos.component.ts` | `test-auditor.mjs` | 2025/26 versionados, demais bloqueados |


## Revisão de homologação dos demonstrativos reais (25/10/2026)
Seis resumos Uber (24 páginas) inspecionados localmente, sem subir PDF pessoal ao GitHub. A amostra revela dois formatos: `earnings_statement` mensal e `annual_earnings_statement` anual. Os relatórios mensais de novembro e dezembro de 2025 estão contidos no resumo anual 2025; contabilizar os três somaria rendimentos em duplicidade. O contrato de extração distingue `Ganhos brutos com viagens` (transporte) de `Extras (valor dado pelo usuário)` (gorjetas); o total bruto inclui ambos. O total de taxas inclui ajuste regulatório negativo no ano 2025, enquanto o repasse reconcilia com o total bruto menos taxa. Corrigidos classificação anual, preferência por agregação anual, saída fiscal por ano e restrição de schema. Validações locais de PDF: 6/6 documentos com contas consistentes. Teste real do Gemini e equivalência jurídica receita tributável seguem pendentes. 

### Matriz complementar
| Requisito | Evidência | Regra determinística | Arquivo | Teste/aceite |
|---|---|---|---|---|
| Agrupar períodos | Anual 2025 e meses 11/12/25 | Preferir anual em períodos sobrepostos, nunca somar ambos | `cloudflare/auditor-core.mjs` e componente | `scripts/test-auditor.mjs`: total canônico único |
| Tipificar relatório | PDF Uber anual possui apenas `2025` no cabeçalho | Ano inteiro em 01/01..31/12; não inventar datas | Schema Gemini | Fixture anual sintética |
| Corrigir sinais | Ajuste regulatório -R$ 2,80 | Taxa líquida já apresentada no total, não reaplicar | Prompt e validação | Reconciliação exata em centavos |
| LGPD e segredo | PDFs com identificadores | Nunca commitar documentos; rotação da chave exposta | `docs/release/auditor-ganhos-homologacao.md` | Revisão pré-produção |
