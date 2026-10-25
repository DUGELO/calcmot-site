# Auditor de Ganhos — Homologação e operação

**Nunca publicar antes de validação de documentação, segurança, LGPD e fiscal.**
Branch: `feat/auditor-ganhos-ir-mvp`; rota: `/ferramentas/auditor-ganhos-ir/`. O MVP não cria conta nem guarda PDFs: processamento efêmero no Cloudflare Worker. O backend não recebe CPF/cadastro, mas pode receber dados pessoais contidos nos arquivos; instrua o motorista a ocultar dados de passageiros.

## Configuração
1. Configure o segredo `GEMINI_API_KEY` no Worker, por meio de gerenciamento secreto do Cloudflare, **jamais no frontend/GitHub**.
2. Configure Cloudflare Turnstile widget para o domínio `calcmot.com.br` e action `auditor_ganhos`. Configure `TURNSTILE_SECRET_KEY` como segredo Worker.
3. Ajuste `src/app/core/constants/auditor.config.ts` com a **site key pública** correspondente. Se estiver vazia, a UI fica fechada por segurança.
4. O `wrangler.jsonc` inclui `AUDITOR_RATE_LIMITER` com 3 chamadas/60s por IP/região. Conferir namespace ID exclusivo com as demais configurações da conta; limites da Cloudflare são aproximados, complementados por Turnstile. Configurar limite diário/alarme de gastos na conta do Gemini.
5. Usar `npx wrangler deploy --dry-run --config wrangler.jsonc` na homologação; não executar deploy de produção sem autorização.
6. Cada arquivo deve ser PDF genuíno, no máximo 4 MiB. Apenas Uber no MVP. A extração Gemini real requer amostras PDF autorizadas, com valores e períodos conhecidos, e revisão dos campos.
7. A API só aceita `POST https://calcmot.com.br/auditor-interno/analisar` com `multipart/form-data`: `document` e `turnstile_token`. Sem sitekey, segredo ou limitador responde 503; com verificação inválida responde 403. Nunca habilitar modo permissivo.
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
