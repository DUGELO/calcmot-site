# Auditor de Ganhos — Homologação e operação

**Nunca publicar antes de validação de documentação, segurança, LGPD e fiscal.**
Branch: `feat/auditor-ganhos-ir-mvp`; rota: `/ferramentas/auditor-ganhos-ir/`. O MVP não cria conta nem guarda PDFs: processamento efêmero no Cloudflare Worker. O backend não recebe CPF/cadastro, mas pode receber dados pessoais contidos nos arquivos; instrua o motorista a ocultar dados de passageiros.

## Configuração
1. Configure o segredo `GEMINI_API_KEY` no Worker, por meio de gerenciamento secreto do Cloudflare, **jamais no frontend/GitHub**.
2. Configure Cloudflare Turnstile widget para o domínio `calcmot.com.br` e action `auditor_ganhos`. Configure `TURNSTILE_SECRET_KEY` como segredo Worker.
3. Configure `AUDITOR_TURNSTILE_SITE_KEY` como variável pública do Worker; `GET /auditor-interno/config` entrega somente disponibilidade e sitekey. O Angular usa renderização explícita e renova o token por documento. Não há segredo nem chave de IA no bundle.
4. O `wrangler.jsonc` inclui `AUDITOR_RATE_LIMITER` com 3 chamadas/60s por IP/região e `AUDITOR_GLOBAL_RATE_LIMITER` com 10 processamentos/60s por chave comum/localidade. Concorrência é limitada a dois requests por isolate; não equivale a teto global distribuído. Conferir namespace ID exclusivo com as demais configurações da conta; limites da Cloudflare são aproximados, complementados por Turnstile. Configurar limite diário/alarme de gastos na conta do Gemini.
5. Usar `npx wrangler deploy --dry-run --config wrangler.jsonc` na homologação; não executar deploy de produção sem autorização.
6. Cada arquivo deve ser PDF genuíno, no máximo 4 MiB e oito páginas. Object streams comprimidos, criptografia, recursos ativos e anexos são recusados conservadoramente. Apenas Uber no MVP. A extração Gemini real requer amostras PDF autorizadas, com valores e períodos conhecidos, e revisão dos campos.
7. A API só aceita `POST https://calcmot.com.br/auditor-interno/analisar` com `multipart/form-data`: `document` e `turnstile_token`. Sem sitekey, segredos, os dois limitadores ou `AUDITOR_DATA_PROCESSING_APPROVED=true` responde 503; com verificação inválida responde 403. Nunca habilitar modo permissivo.
8. Antes de habilitar, revisar a Política de Privacidade do CalcMot com finalidades, base legal, fornecedor Gemini, retenção temporária, tratamento de dados de terceiros, direitos e contato. A marcação do formulário não substitui essa revisão.

## Privacidade e dados
Worker não guarda documento, texto de comprovante nem resposta Gemini após atender a requisição. Resultado fica na memória Angular até atualizar/fechar a aba ou tocar “Apagar dados da sessão”; exportação CSV é iniciada localmente. A passagem via infraestrutura do provedor externo segue a política contratada com o Google; não afirmar inexistência de retenção no Google. Não há endpoint para reabrir documentos anteriores. Dados de logs de segurança do edge podem registrar metadados de requisição; não registrar corpo ou resposta no observability.

## Testes disponíveis
- `npm ci`
- `npm run test:auditor`
- `npm run qa:static`
- `npm run test:calculator`
- `npm run test:analytics`
- `npm run build`
- `npm run build:cloudflare`
- `npx wrangler deploy --dry-run --config wrangler.jsonc`
- CI de navegador e SEO existente no GitHub. Testar o upload com PDFs anonimizados + credenciais em ambiente de homologação antes de produção.

## Matrizes de erro e aceite
- PDF inválido/muito grande → bloqueio no cliente e no servidor.
- Sitekey, rate limiter ou segredos ausentes → serviço desabilitado, nunca fallback sem proteção.
- Extração não estruturada/99 → resposta 422; não gerar campos arbitrários.
- Duplicata exata → bloqueio por SHA-256 em memória.
- Sobreposição temporal → marcador de revisão; não somar ao consolidado.
- Repasses ausentes ou bruto ausente → bloqueio ou pendência.
- Fiscal: somente PF elegível anos 2025 ou 2026, bruto comprovado; 60% mínimo tributável, 40% máximo isento. **Atenção**: o guia original 20/80 para passageiros está errado conforme Receita. Para MEI, nenhum cálculo fiscal automático; para 2026, somente divisão 60/40 de receita comprovada, sem imposto devido.
- Não disponibilizar código de ficha oficial ou DARF baseado em uma extração não verificada.
- Extração em produção e resultado de consumo financeiro do provedor não foram validados sem credenciais.

## Rollback
Reverter apenas o PR/merge desta branch e o vínculo público; remover `GEMINI_API_KEY` e `TURNSTILE_SECRET_KEY` após rollback, se exclusivos. Sem migração e sem dados históricos para apagar. Preservar integridade do gateway `/api/*` e do painel `/admin`.


## Homologação documental de 25/10/2026 (sem envio de PII ao repositório)
O usuário forneceu seis PDFs Uber reais (24 páginas): anual 2025, novembro e dezembro 2025, janeiro, fevereiro e março 2026. Inspeção local com extração de texto (sem chamadas externas) confirmou os seguintes valores, exclusivamente para teste e sem dados de identificação:

| Período | Bruto total | Taxas totais | Repasse | Viagens brutas | Extras |
|---|---:|---:|---:|---:|---:|
| Ano 2025 | R$ 18.442,54 | R$ 3.065,91 | R$ 15.376,63 | R$ 18.413,54 | R$ 29,00 |
| Nov 2025 | R$ 5.306,09 | R$ 927,88 | R$ 4.378,21 | R$ 5.284,09 | R$ 22,00 |
| Dez 2025 | R$ 1.842,82 | R$ 241,01 | R$ 1.601,81 | R$ 1.842,82 | R$ 0,00 |
| Jan 2026 | R$ 16,01 | R$ 4,01 | R$ 12,00 | R$ 16,01 | R$ 0,00 |
| Fev 2026 | R$ 776,43 | R$ 91,60 | R$ 684,83 | R$ 776,43 | R$ 0,00 |
| Mar 2026 | R$ 108,16 | R$ 27,53 | R$ 80,63 | R$ 108,16 | R$ 0,00 |

Resultados locais: seis arquivos e 24 páginas legíveis, reconciliação bruto - taxa = repasse nos seis, ganho bruto de viagens + extras = total nos seis, identificação do período anual sobreposto e ajuste regulatório negativo de R$ 2,80 dentro do total anual. Os documentos reais NÃO foram commitados e não poderão ser distribuídos em artifacts. O teste manual de texto extraído NÃO prova resultado da API Gemini. O endpoint real continua pendente de configuração das credenciais, Turnstile e acesso seguro de homologação.

### Correções de contrato identificadas pelos PDFs
- Documento com cabeçalho apenas `2025` é relatório anual e deve ocupar o intervalo 01/01–31/12; relatório anual prevalece na consolidação sobre meses com interseção.
- O campo `grossPassengerCents` contém somente `Ganhos brutos com viagens`. `Extras (valor dado pelo usuário)` é separado como gorjetas; não duplicar o total da página 1.
- `Taxas regulatórias (-R$ 2,80)` no anual 2025 é ajuste de sinal, não taxa positiva. O total de taxas (R$ 3.065,91) já contém esse ajuste.
- O resumo Uber informa expressamente que não é nota fiscal ou informe de rendimentos: relatório financeiro não equivale automaticamente à declaração fiscal ou identificação da fonte pagadora.

### Avaliação LGPD preliminar — ainda não é parecer jurídico
As seis amostras incluem identificação pessoal. Não anexar originais ao PR nem a logs, fixtures ou artifacts. Somente publicar os valores agregados sem vínculo à pessoa no material técnico. O controlador deverá informar finalidade, fornecedor externo Google, base legal, contato e direitos do titular; documentar transferência internacional, retenção do fornecedor, possíveis suboperadores e processo de incidente. Consentimento específico na interface não elimina outras obrigações da LGPD. Os dados são efêmeros no backend próprio conforme código atual, mas **não é correto prometer eliminação imediata dos sistemas do fornecedor externo**. Validar contrato/plano pago antes de produção. Chave API compartilhada em canal de conversa deve ser rotacionada antes de configuração como segredo Worker.

## Operação final: 25/10/2026

Revisão jurídica/técnica rastreável em [auditor-ganhos-lgpd-fiscal.md](./auditor-ganhos-lgpd-fiscal.md). Esta seção substitui instruções anteriores sobre sitekey compilada.

### Configuração adicional obrigatória

- `AUDITOR_ALLOWED_ORIGIN`: origem HTTPS exata do ambiente; padrão somente `https://calcmot.com.br`. Não aceitar domínio de preview arbitrário. Turnstile deve permitir esse hostname e validar action.
- `AUDITOR_DATA_PROCESSING_APPROVED=true`: definir somente após comprovar projeto Gemini com billing ativo, condições de tratamento e mecanismo de transferência internacional, controlador/canal identificados e cotas rígidas/alertas. Não é um detector automático de compliance.
- `AUDITOR_TURNSTILE_SITE_KEY`: sitekey pública correspondente ao secret do mesmo ambiente.
- Segredos continuam exclusivamente `GEMINI_API_KEY` e `TURNSTILE_SECRET_KEY` no Worker. Não usar chave comprometida da conversa. Não executar `wrangler secret put` em produção inadvertidamente. Preferir `wrangler versions secret put`/versão não promovida, conforme comandos suportados da versão instalada.
- Para staging, usar Worker/ambiente separado, **sem custom domains/routes de produção**, sem gateway/admin de produção, com secrets, limiters e hostname próprios. Configuração top-level atual é de produção: nunca usá-la para publicar uma homologação. Acesso remoto ainda necessário para criar/verificar o ambiente correto.
- Até 12.000 tokens de entrada com countTokens antes da geração, 1.500 tokens de saída, uma contagem + uma geração e deadline Gemini compartilhado de 30 s. Modelo pinado precisa estar disponível na conta; não trocar silenciosamente por alias latest.

### Diagnóstico CI confirmado

A execução [40239811694](https://github.com/DUGELO/calcmot-site/actions/runs/40239811694) falhou antes de criar jobs. Parser YAML reproduziu `mapping values are not allowed here`, linha 55, coluna 22: nome de etapa `Auditor: regras fiscais...` sem aspas. Correção: citar a string inteira, preservando push, pull_request, workflow_dispatch, concurrency e todas as verificações. Outro defeito identificado na execução local completa: rota ausente do sitemap; adicionada a URL do auditor. Não atribuir a falha de parsing ao Node, billing de Actions ou ao código Angular. Permissões/políticas administrativas do repositório não ficaram acessíveis pela API anônima (401).

### Rollback e escopo

Base main verificada inicialmente: `b4200894ee9e08bebfb0b3ca9d7f3681bb48dae5`; head inicial do PR: `06e634dde1c54b57c606029128d60bc6f93feb2f`. Sem merge nesta operação até aprovação de todos os gates. O código novo mantém todos os acessos fechados quando falta configuração. Rollback de aplicação futura: restaurar a versão Worker anterior conhecida e só então reverter o merge; registrar IDs reais em Cloudflare antes da promoção. Nenhuma versão remota anterior foi inventariada sem login, portanto rollback de produção **não homologado**.

### Evidências executadas nesta revisão

- `npm ci` e todos os dez comandos obrigatórios executados localmente com sucesso após correções; 34 testes novos de Worker/segurança PASS, 41 testes administrativos PASS, além dos assertions fiscais/calculadora/analytics e edge existentes.
- Build Angular: sete rotas prerenderizadas. `verify-prerender`, `verify-admin-build`, GA4 `--plan`, Wrangler dry-run e workerd local PASS. Dry-run não é publicação nem prova de bindings remotos.
- Auditor E2E: quatro cenários PASS (320, 390 e 1280 px + configuração ausente), com upload, duplicata, revisão, prioridade anual, CSV, prévia por ano, exclusão/cancelamento, quota, PDF inválido, labels, teclado e ausência de overflow. Gemini e Turnstile **simulados**, sem tráfego a provedores. Screenshots somente de dados sintéticos em artifact do CI.
- Regressão E2E calculadora: 320, 390, 768 e 1024 px PASS. Analytics com hostname de produção simulado e fornecedores interceptados; nenhuma medição GA4 real enviada. O teste espera eventos reais após hidratação, sem sleep que esconda falhas.
- Seis PDFs originais reabertos privadamente: todos com quatro páginas, passaram o novo parser; texto conferido contra os valores da tabela acima, anual também renderizado para inspeção visual. **Nenhuma chamada autenticada Gemini**, portanto resultado do modelo, tokens/custo/latência reais permanecem não medidos.
- Infraestrutura: `wrangler whoami` informou ausência de autenticação; formulário seguro Cloudflare recusado; console Google Cloud retornou `Site Unavailable`. Sem credenciais de administração Google/Cloudflare disponíveis. Não revogar, criar ou instalar chave sem acesso verificado.
- Produção observada no navegador: solicitar `/ferramentas/auditor-ganhos-ir/` termina na home `/`; auditor ainda não disponível. Requisições diretas do container retornaram HTTP 403, portanto não são usadas como status certificado da origem. Nenhum merge/deploy realizado.
- Varredura de 156 commits: sem padrão da chave Gemini exposta; ocorrências AIza são configuração pública Firebase. Zero PDFs rastreados no repositório. Não extrapolar para artifacts remotos não auditados.

Os checks **do novo commit remoto** precisam ser acompanhados antes de declarar CI verde; evidências antigas não aprovam automaticamente este diff. Publicação, rotação de chaves, contas/contratos, limites reais de custo, preview seguro e rollback remoto seguem bloqueados por acesso externo.

## Retomada autenticada — 25/10/2026

Esta seção atualiza os bloqueios históricos de acesso acima. Google Cloud e Cloudflare foram acessados pelo navegador após login do proprietário. O proprietário determinou **manter Gemini gratuito e bloquear PDFs pessoais**. Essa decisão impede a homologação real dos seis PDFs e o lançamento conforme os gates originais; não substituí-la por consentimento ou por PDFs apenas visualmente ocultados.

| Item | Evidência atual |
|---|---|
| Projeto Gemini | `gen-lang-client-0493370776` / `821407219804` (CalcMot), separado do Firebase `calcmot`; nível gratuito confirmado no AI Studio. |
| Credencial | Existente restrita à Gemini API, vinculada a conta de serviço, sem restrição de aplicativo. Não impor referenciador HTTP a Worker backend; restrição por IP exige saída estável comprovada. Valor não utilizado. Rotação/revogação continuam pendentes. |
| Modelo/cotas | Painel autenticado lista Gemini 2.5 Flash Lite com 10 RPM, 250.000 TPM e 20 RPD; máximos de uso exibidos iguais a zero nos últimos 28 dias. Painel não equivale a `models.list` autenticado ou teste de geração, e métricas têm atraso. Nenhuma chamada de inferência foi feita nesta retomada. |
| Cloudflare | Conta/Worker corretos confirmados; produção `calcmot-site`, main `b4200894ee9e08bebfb0b3ca9d7f3681bb48dae5`, versão ativa exibida `b515b469` a 100%. Preview da branch existente; produção sem variáveis/secrets do auditor e sem os limiters da branch. Nenhuma promoção/configuração de produção realizada. |
| Turnstile | Widget `CalcMot Auditor - Producao`, Managed, hostname `calcmot.com.br`, sem pre-clearance. Criado, **não instalado nem homologado**. Segredo apareceu indevidamente em uma saída de leitura de tela: tratar como exposto e rotacionar antes de instalar. Nenhum segredo/fingerprint incluído nos arquivos do projeto. |
| Privacidade | Eduardo Oliveira / `eduardangelo20001@gmail.com`, dados fornecidos expressamente pelo proprietário e incluídos no código da política. E-mail preservado exatamente como informado. Atendimento real e contratos ainda não certificados; política atualizada ainda não publicada. |
| Produção HTTP | GET da rota do auditor seguiu redirecionamento e terminou na home `https://calcmot.com.br/`, HTTP 200. Não comprova operação da funcionalidade. |
| Rollback | Versão ativa identificada acima é candidata à recuperação futura, não um teste de rollback executado. Nenhum deploy novo para reverter. |

### QA desta retomada

- `npm ci --no-audit --no-fund`: PASS, 555 pacotes. Todas as sete suítes/guardrails solicitadas: PASS; 34/34 testes Worker/segurança e 41/41 administrativos, mais assertions fiscais, calculadora, analytics e edge.
- `npm run build`, `npm run build:cloudflare`, `verify-prerender`, `verify-admin-build`, GA4 `--plan` e Wrangler dry-run: PASS. Builds finais incluem controlador, contato e aviso de bloqueio no plano gratuito; sete rotas prerenderizadas.
- E2E auditor: 4/4 cenários, 0 erros JS, 320/390/1280 px + configuração indisponível; upload, dedup, exceções, anual, exportação, ano fiscal, exclusão/cancelamento, quota, PDF inválido, labels/teclado/layout. Turnstile/Gemini simulados, PDFs sintéticos.
- E2E calculadora: 4/4 larguras (320/390/768/1024); analytics: 3/3 cenários, domínio simulado e fornecedores interceptados. Nenhum evento financeiro real enviado.
- `verify-admin-workerd`: falha inicial `ECONNRESET` no Windows reproduzida com Node 24 e 22.16.0 após POST recusado antes de consumir corpo. Assets isolados passaram. `Connection: close` somente nesse POST de teste evita reutilizar a conexão encerrada. Script definitivo PASS com Node 22.16.0 e data workerd local `2026-10-13`, preservando todos os asserts e a configuração de produção.
- Python Playwright 1.58.0 e Chromium instalados em ambiente de QA isolado `.angular/qa-venv`, sem dependência nova do produto. Evidências visuais locais em `.angular/auditor-e2e` e `.angular/release-evidence`, somente dados sintéticos ou lista de widget sem segredo.
- Nenhum PDF rastreado no Git e nenhum PDF encontrado na pasta autorizada `Documents/ChatGPT` nesta retomada. Não executar busca invasiva nem solicitar reenvio enquanto o plano gratuito impedir o uso desses documentos.
- Varredura atual de padrões de credenciais: somente configuração pública Firebase no código rastreado. Histórico contém a sigla textual FAQ, que não é credencial. Isso não certifica artifacts remotos, forks ou conversas.

**LANÇAMENTO BLOQUEADO**: opção gratuita impede PDFs pessoais; rotação Gemini/Turnstile e instalação segura não concluídas; contratos/transferência/retencão, endpoint staging real, homologação dos seis PDFs, custos, monitoramento e rollback operacional permanecem gates. O CI do novo commit desta atualização deve ser confirmado remotamente. Não fazer merge nem promover produção só porque o build passou.
