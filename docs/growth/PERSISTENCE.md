# Persistência operacional — CalcMot

## Estado e retomada
O ciclo de leitura e auditoria usa scripts/growth/cycle.mjs e checkpoints JSON versão 2. Cada tarefa recebe hash estável de tipo, alvo e revisão; checkpoints são gravados por arquivo temporário e rename após cada tarefa. A exclusão mútua usa lock com prazo maior que o limite do ciclo. Leases interrompidos retornam à fila, enquanto intenções externas pendentes passam a unknown_outcome e exigem revisão, sem reenvio.

O runner recupera inventário, ledger e último artifact confiável do mesmo workflow, repositório e branch. O workflow usa tokens somente de leitura e não executa jobs de forks. Artifacts duram 90 dias; se não houver checkpoint válido, a recuperação parte dos registros versionados. Não há banco externo.

## Fases implementadas
1. Recovery: reconciliação da prova histórica e leases.
2. Discovery: importação de candidatos e leitura de uma lista pública curada via API GitHub, com deduplicação por domínio registrável. Os resultados continuam leads desconhecidos.
3. Qualification: triagem factual de HTTP, menções a login, CAPTCHA, custo e restrição de automação. Esses sinais nunca aprovam elegibilidade automaticamente.
4. Execution: reconciliação de envios já comprovados e fila para execução pelo agente desktop autorizado. Nenhum adaptador de formulário ou e-mail está habilitado no Actions. O helper executeOnce exige aprovação explícita e checkpoint antes de qualquer side effect, preservando resultados incertos.
5. Verification: GET público e inspeção de links; erros transitórios mantêm a última prova e registram tentativa atual desconhecida.
6. Reporting: métricas históricas e atuais separadas; a meta permanece incompleta sem 100 domínios reconfirmados.

Máximos por execução Node: 12 tarefas, 20 requisições, orçamento de 180 segundos antes de novas tarefas, três tentativas com backoff, limites de resposta e timeout por requisição. Uma requisição iniciada perto do prazo pode terminar depois dele; o workflow tem timeout total de oito minutos. Descoberta/triagem/verificação têm cotas separadas para evitar que uma fila monopolize o ciclo. O histórico detalhado preserva as últimas 100 execuções.

## Comandos
node --test tests/growth/*.test.mjs

node scripts/growth/cycle.mjs docs/growth/prospects.json previous-growth-state.json growth-state.json growth-outreach-report.md

O arquivo de saída deve ser preservado como entrada da execução seguinte. Confira os recibos no ledger antes de realizar qualquer envio pelo desktop. Dados sensíveis e tokens não entram no checkpoint.

## Domínios e verificação
scripts/growth/domains.mjs usa snapshot oficial da Public Suffix List, incluindo ICANN e PRIVATE, com licença, data e checksum em docs/growth/data. Não instala dependência adicional. Regras exatas, wildcard, exceções e IDN são consideradas; sufixos desconhecidos não rendem domínios confirmados. Páginas internas do próprio CalcMot e páginas duplicadas são excluídas da aquisição. Metadados permitindo indexação são apenas sinais; indexação real continua desconhecida.

## Agendamentos
A retomada desktop está ACTIVE, diariamente às 10h de America/Sao_Paulo, com 20 minutos, dez oportunidades e três contatos individuais por ciclo. Preserva permissões, cotas gratuitas e bloqueios; não notifica pendências inalteradas.

O cron GitHub foi preparado para 10h17 no mesmo fuso. Ele só será recorrente após o workflow estar no branch padrão. PR #18 continua draft, sem merge. O trigger pull_request permite validar leitura/checkpoints no próprio PR; execução remota só pode ser afirmada após existir um run comprovado.

## Limites observados em 05/11/2026
IndexFlow retornou 402: um domínio histórico, zero reconfirmados hoje e uma situação atual desconhecida. Navegação CUA indisponível por propriedade do runtime; nenhum formulário novo executado. Três propostas individuais foram enviadas pelo conector Gmail e registradas. Não há promessa de aprovação editorial ou de alcançar a meta em prazo fixo.
