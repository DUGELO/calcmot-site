# Evidências da integração privada — 05/11/2026

## Passou localmente
- 18 testes da infraestrutura: separação entre salvar/publicar, atualização individual, isolamento de imagens compartilhadas, metadados derivados, aliases, retirada, integridade, adulteração, falhas de entrega, CAS de Git, revisão antiga, recuperação real de texto/mídia, rollback e contrato Cloudflare.
- 7 testes do blog existente, adaptados para não depender de configuração editorial pública.
- qa:static e build Angular: 7 rotas estáticas no catálogo real vazio.
- Homologação com 13 artigos temporários em snapshot externo e draft em área de trabalho separada: 23 rotas totais, 17 editoriais, HTML integral sem JavaScript, metadados, sitemap, 404 e aliases.
- Chromium: 320, 390, 768, 1024 e 1440 px; categorias, paginação, imagens e navegação.
- workerd + Assets e Wrangler dry-run.
- Empacotamento do coordenador sem recompilar Angular.
- Regressões existentes: 43 testes administrativos, QA admin/edge, calculadora, analytics, ride insights e Gemini.
- Configuração privada: campos, ações e fila de execução validados por código.

Os dados usados são sintéticos e temporários. Não há artigo real nem imagem privada no repositório público. Não houve chamada de deploy de produção nem uso de credencial Cloudflare real.

## Evidência versus aceite real
| Cenário | Evidência disponível | Aceite externo |
| --- | --- | --- |
| Criar/salvar/retomar no CMS | Formulário e repos preparados | Pendente de teste autenticado |
| Visualizar no CMS | Recurso visual documentado | Pendente de teste com editor |
| Publicar/atualizar/retirar | Engine e builds em snapshot passaram | Ação real e distribuição pendentes de autorização |
| Salvar edição incompleta | Snapshot anterior preservado em teste | Confirmar experiência na interface |
| Recuperar | Operação Git real recuperou texto e imagem e preservou outro artigo | Botão no CMS pendente |
| Falhas | Validação, entrega, smoke e rollback simulados passaram | Falha real de serviço não provocada em produção |
| Concorrência | CAS real, revisão antiga e contrato da fila | Fila remota de múltiplas ações pendente |
| Mudança do código | Snapshot e datas preservados em teste | Dispatch entre contas pendente de configuração |
| Rollback | Código, conteúdo e contrato de restauração testados | Rollback remoto não executado |

A automação do navegador falhou na retomada com registered runtime ownership is missing; reinicializar a conexão não resolveu. O mesmo erro persistiu na nova tentativa após o bootstrap privado. Não foi possível observar o editor funcionando nem executar os cenários autenticados. O CI, isoladamente, não homologa esse requisito.

Não medir SLA usando durações desta sessão: a máquina interrompeu execuções locais por períodos longos. O objetivo de até cinco minutos e a meta de duas ações precisam de medição real após a ativação.

## Pré-requisitos de release
Bootstrap privado aprovado e integrado no PR #1; sua validação remota passou. O PR #15 continua sem merge. Antes de ativar produção: conferir GitHub App/atores/permissões, configurar credenciais de serviço, testar a interface, autorizar e drenar a transição do Workers Builds e então habilitar o coordenador. Nenhuma dessas etapas deve ser presumida concluída.
