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
- Fiscal: somente PF elegível ano 2025, bruto comprovado; 60% mínimo tributável, 40% máximo isento. **Atenção**: o guia original 20/80 para passageiros está errado conforme Receita. Para 2026/MEI, nenhum cálculo fiscal automático.
- Não disponibilizar código de ficha oficial ou DARF baseado em uma extração não verificada.
- Extração em produção e resultado de consumo financeiro do provedor não foram validados sem credenciais.

## Rollback
Reverter apenas o PR/merge desta branch e o vínculo público; remover `GEMINI_API_KEY` e `TURNSTILE_SECRET_KEY` após rollback, se exclusivos. Sem migração e sem dados históricos para apagar. Preservar integridade do gateway `/api/*` e do painel `/admin`.
