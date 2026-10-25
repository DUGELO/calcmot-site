# Auditor: registro de tratamento, segurança e limites fiscais

Verificado em **25/10/2026**. Revisão técnica baseada em fontes públicas; não é parecer de advogado ou aprovação contábil. **Lançamento bloqueado** enquanto identidade do controlador, contratos, configuração das contas e homologação externa não forem comprovados.

## Fontes, hierarquia e interpretação

| Fonte | Natureza | Aplicação e limites |
|---|---|---|
| [LGPD, texto compilado](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) | Lei 13.709/2018 | Arts. 6, 7, 8, 9, 18, 33, 37, 38, 46 e 48: necessidade, base legal, informação, direitos, transferência, registros e segurança. |
| [Regulamentações vigentes ANPD](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/) | Regulamentação | Lista consultada inclui Resoluções 15/2024, 18/2024, 19/2024 com retificação de 18/08/2025 e 32/2026. |
| [Resolução 19/2024](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-19-de-23-de-agosto-de-2024) | Regulamentação | Identificar exportador/importador e mecanismo do art. 33 para cada contrato. Prazo inicial de adaptação das cláusulas já encerrado; não presumir que SCC europeia satisfaz a brasileira. |
| [Transferências internacionais ANPD](https://www.gov.br/anpd/pt-br/assuntos/assuntos-internacionais/transferencia-internacional-de-dados) | Orientação oficial | Adequação da UE pela Resolução 32/2026 não é autorização genérica para processamento global nos EUA ou outros países. Não presumir localização europeia de Gemini/Cloudflare. |
| [Procedimento de incidentes](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis) e Resolução 15/2024 na lista acima | Regulamento e procedimento | Avaliar risco/dano relevante; regra geral de comunicação em três dias úteis do conhecimento pelo controlador. Verificar condições e prazos específicos de pequeno porte, sem presumir dispensa. Registrar inclusive decisão de não comunicar, observando guarda do registro de incidente por pelo menos cinco anos. |
| [Guia de segurança de pequeno porte](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-sobre-seguranca-da-informacao-para-agentes-de-tratamento-de-pequeno-porte) | Orientação oficial, não dispensa legal | Controle de acesso, credenciais, treinamento, atualizações e registro de operações. |
| [Termos Gemini](https://ai.google.dev/gemini-api/terms) | Condição contratual do fornecedor | Dados pessoais/confidenciais não podem ser enviados a Unpaid Services. Paid Services na API exigem projeto com faturamento ativo. Google não usa conteúdo para melhorar produtos nesse regime, mas pode reter para segurança. |
| [Retenção Gemini](https://ai.google.dev/gemini-api/docs/zdr) | Documentação oficial | Não prometer ZDR: monitoramento de abuso pode reter prompts/respostas. PDF inline evita Files API e sua retenção própria; não desativa retenção de segurança do fornecedor. Não usamos Files, caching explícito, grounding, tuning ou sessões persistentes. |
| [Aditivo de tratamento Google](https://business.safety.google/processorterms/) | Contrato a confirmar na conta | Termos Gemini remetem ao aditivo para Paid Services. Confirmar partes, abrangência, suboperadores e anexos aplicáveis. [SCC brasileira Google Cloud](https://cloud.google.com/sccs/br-c2p?hl=pt-br) não deve ser presumida automaticamente incorporada ao contrato Gemini Developer API. |
| [Análise Mayer Brown de 29/08/2025](https://www.mayerbrown.com/pt/insights/publications/2025/08/end-of-grace-period-implementation-of-brazils-standard-contractual-clauses-in-international-transfers-of-personal-data) | Comentário jurídico de terceiros | Destaca término da adaptação e incorporação das cláusulas. Não substitui norma ou análise do contrato CalcMot. |
| [Análise Mattos Filho de 27/01/2026](https://www.mattosfilho.com.br/unico/brasil-ue-protecao-dados-equivalentes/) | Interpretação jurídica publicada | Contextualiza adequação Brasil/UE. Não resolve transferências subsequentes globais do fornecedor. |
| [Receita: Carnê-Leão, rendimentos](https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/pagamento/carne-leao/rendimentos) | Orientação fiscal oficial | Transporte pessoal de passageiros PF: mínimo 60% tributável, observadas condições de exploração pessoal. Carnê-Leão depende da fonte PF/exterior, não só do intermediário do pagamento. |
| [Receita: rendimentos do trabalho](https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/preenchimento/manual-mir/rendimentos/rendimentos-do-trabalho) | Manual oficial | Até 40% não tributável, presumidamente consumido, não justifica acréscimo patrimonial. Regras MEI distintas. |

A consulta à lista oficial não identificou substituição da regra de passageiros 60/40. Não confundir propostas legislativas de 20/80 ou regras de IBS/CBS com IRPF. A prévia para ano-calendário 2026 não afirma homologação de instruções de preenchimento da declaração do exercício 2027.

## Registro da operação (ROPA)

| Elemento | Tratamento previsto / evidência necessária |
|---|---|
| Controlador | Responsável pela operação do CalcMot. **Nome/razão social e identificação formal ainda precisam ser confirmados pelo proprietário**; não inferir uma pessoa jurídica a partir do GitHub. |
| Operadores / demais agentes | Cloudflare: entrega/execução Worker e desafio Turnstile; Google: extração Gemini conforme plano contratado. Papéis para metadados próprios podem ser de controlador independente conforme contrato. Confirmar entidades contratantes e suboperadores. |
| Titulares | Motorista que envia seu próprio demonstrativo. Não solicitar documentos de passageiros. |
| Categorias | PDF pode conter nome, CPF, endereço e dados de corridas; só períodos, categorias financeiras, quilometragem e rótulos de origem são devolvidos. Nome de arquivo permanece local e é substituído por `demonstrativo.pdf` no upload. |
| Finalidade | Gerar relatório financeiro solicitado e prévia fiscal limitada. Não vender, anunciar, treinar modelo próprio ou compartilhar entre motoristas. |
| Base legal adotada para MVP | Consentimento específico (art. 7 I, art. 8) para extração facultativa com fornecedor externo; separado de download/app e da opção fiscal. Não usar consentimento do motorista como autorização automática para dados de terceiros. Avaliar art. 7 V se houver relação contratual e documentar a mudança, sem acumular bases genéricas. |
| Transparência | Aviso antes do upload, link para política, distinção Android local/web externa e limite da exclusão local. Identificação formal do controlador e canal de atendimento efetivo são gates pendentes. |
| Entrada / fluxo | Navegador → HTTPS Cloudflare Worker → contagem de tokens Gemini → geração Gemini → resposta canônica → memória da página → CSV local por ação do usuário. |
| Retenção própria | PDF e resposta bruta em memória durante a requisição; nenhum banco/R2/Queue/histórico. Resultado apenas em memória da aba. Sem cache HTTP. Não prometer destruição forense da RAM ou cancelamento remoto garantido. |
| Retenção externa | Google: limitada para segurança conforme termos, prazo exato não certificado; Cloudflare: metadados de infraestrutura conforme contrato/conta. **Prazos e configurações reais ainda não auditados**. |
| Transferência | Mapear países, importadores e instrumento aplicável antes de ativar. Consentimento de extração não é consentimento específico e destacado para transferência internacional do art. 33 VIII. Não foi escolhido esse mecanismo implicitamente. |
| Direitos e atendimento | `/suporte/` encaminha ao canal publicado na ficha oficial do aplicativo. Confirmar responsável, funcionamento e prazo interno. Pedir só dados mínimos de autenticação proporcional; nunca PDF/CPF completo no primeiro contato. Sem histórico próprio, explicar impossibilidade de recuperar sessão encerrada e encaminhar solicitações aplicáveis aos fornecedores. |
| Exclusão | Apagar/fechar remove sessão; cancelamento local impede restauração por resposta tardia. CSV baixado fica com usuário. Sem endpoint público de recuperação e sem segregação por ID necessária enquanto não existe persistência. |
| RIPD | Avaliação preliminar recomenda relatório de impacto antes da escala: documentos financeiros/CPF, IA externa, transferência internacional e serviço anônimo. Não declarar obrigação universal ou dispensa. Se ANPD exigir, atender art. 38. Riscos residuais impedem ativação até os gates. |

## Controles e limitações técnicas

- Uma solicitação: um PDF, até 4 MiB, oito páginas, multipart com campos exclusivos, leitura total limitada mesmo sem Content-Length e prazo de oito segundos para o corpo.
- Parser estrutural sem renderizar ou executar conteúdo; bloqueia criptografia, JavaScript, ações, anexos e formatos com object streams comprimidos. Esse último limite é conservador contra inflação de objetos; formatos legítimos fora do subconjunto recebem erro, não alegação de malware. Não é antivírus nem garantia absoluta contra PDF malicioso.
- Limites declarados: 3 tentativas por IP/60 s; 10 processamentos/60 s por chave comum por localidade; máximo de dois requests simultâneos por isolate. Bindings Cloudflare são aproximados/regionais, **não um teto global distribuído nem orçamento diário**. Cotas rígidas no fornecedor e alertas ainda são obrigatórios.
- Contagem de tokens antes de geração: até 12.000 entrada; até 1.500 saída; uma contagem e uma geração, sem retries automáticos. Deadline compartilhado de 30 segundos para Gemini. Modelo estável pinado `gemini-2.5-flash-lite`; precisa constar em `models.list` da conta. Nenhuma substituição automática por modelo mais caro ou alias `latest`.
- Turnstile verificado no backend: sucesso, hostname exato do ambiente e action `auditor_ganhos`. Tokens inválidos, expirados ou repetidos são recusados pelo Siteverify. Sem configuração/segredos/limiter/atestado de tratamento, 503 antes do Gemini.
- `AUDITOR_DATA_PROCESSING_APPROVED=true` é atestado operacional **somente após verificação humana/documental** de projeto pago, contratos, transferência e orçamento. Não detecta sozinho plano de faturamento nem estabelece conformidade legal.
- Sem mensagens livres do modelo na API: campos enumerados, datas ISO válidas, centavos inteiros, rótulos de origem em allowlist; extras de JSON descartados. Prompt trata PDF como dado não confiável. Não afirmar resistência absoluta a prompt injection: coerência não comprova verdade documental; validação Gemini real continua gate.
- Nada de conteúdo em console/analytics/cache. Eventos categóricos, DOM financeiro mascarado ao Clarity e sem iniciar replay em acesso direto ao auditor. Não modificar coleta das demais páginas nesta operação. Revisão completa do consentimento de analytics do site é trabalho separado, sem usar os PDFs para publicidade.
- API: Origin exata, sem CORS permissivo, no-store, nosniff, noindex, no-referrer, CSP default-src none e frame-ancestors none. Cabeçalhos do HTML e CSP final do hosting precisam ser inspecionados no preview; testes locais não certificam a configuração de borda real.

## Regras fiscais versionadas

`PF_PASSENGER_TRANSPORT_2025_60_40` e `PF_PASSENGER_TRANSPORT_2026_60_40`: PF elegível, base de transporte comprovada, ano integral coerente, sem períodos repetidos; divisão em centavos usando inteiros/BigInt e arredondamento conservador para cima na parcela mínima tributável. Não calcula imposto, deduções, redução de IR, DARF, obrigação de declarar ou transmissão.

Receitas/repasse/taxas e gorjetas/incentivos/reembolsos ficam separados. Fonte pagadora não é determinada pela marca Uber nem por seu CNPJ impresso no PDF. Gorjetas, incentivos ou reembolsos positivos/ausentes bloqueiam a saída fiscal afetada até classificação específica; **não são classificados como isentos por conveniência nem somados automaticamente à base de transporte**. O relatório financeiro continua válido. MEI/PJ exigem motor próprio, dados de escrituração e enquadramento; estão bloqueados. Despesas operacionais ausentes não são zero nem transformam repasse em lucro.

O resumo Uber contém ressalva de que não é nota fiscal/informe de rendimentos. Ele sozinho não identifica todos os passageiros/fonte pagadora, não comprova todas as rendas do contribuinte nem substitui declaração anual. Não extrapolar a conferência de seis PDFs para precisão geral.

## Incidente da credencial compartilhada

Estado: exposição em conversa conhecida; rotação e revogação **não concluídas sem acesso à conta**. Não gravar valor/fingerprint em PR ou screenshot. Sem evidência de uso indevido até aqui; não concluir inexistência de incidente com dados pessoais. Tratar revogação como prioridade e consultar métricas de uso/faturamento em janela antes/depois da exposição. Varredura de padrões em 156 commits acessíveis encontrou somente configuração pública Firebase, nenhuma chave no formato exposto da Gemini. Isso não certifica artifacts, forks ou conversas; artifacts remotos precisam ser auditados com o acesso apropriado.

Procedimento: restringir serviço e evitar novos envios; preservar metadados mínimos e linha do tempo privada; rotacionar em versão não promovida, validar e revogar anterior; apurar acesso a dados e custos; classificar risco/dano; comunicar responsável e, quando aplicável, ANPD/titulares no prazo legal; registrar decisões, contenção e correção. Não comunicar incidente à ANPD em nome do controlador sem representação/autorização específica. Chave comprometida não implica automaticamente vazamento dos PDFs.

## Pendências externas de liberação

1. Acesso Google Cloud/AI Studio para identificar projeto, credencial, billing, restrições, cotas, consumo, modelos e contratos; substituir/revogar chave.
2. Acesso Cloudflare para auditar conta/ambientes, configurar secrets e sitekey por ambiente, verificar namespace IDs exclusivos, quota/custo e telemetria sem corpos.
3. Responsável formal do controlador e canal de privacidade operacional; comprovação do mecanismo internacional e retenção contratual.
4. Homologação dos seis PDFs na API autenticada e endpoint staging, custos/tokens/latência reais, CSP/telemetria do preview e smoke de produção após todos os gates.
