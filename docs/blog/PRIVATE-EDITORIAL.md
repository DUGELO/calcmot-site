# Operação editorial privada — revisão de 05/11/2026

## Estado e decisão
O PR #15 continua em rascunho. Angular, layout, rotas, prerender e SEO foram preservados. Código e infraestrutura ficam em DUGELO/calcmot-site; a fonte editorial passa a DUGELO/calcmot-content, criado com visibilidade Private.

Pages CMS permanece a opção principal **condicionada à prova de uso autenticada**. A sessão real foi aberta, mas criação/edição/publicação ainda não foram homologadas. Na retomada, a automação do navegador falhou por ausência do registro de runtime. Isso não é resultado positivo de usabilidade.

## Avaliação de CMS
| Item | Pages CMS | Decap CMS |
| --- | --- | --- |
| Editor visual e mídia | Documentado; configuração reduzida preparada | Nativos |
| GitHub privado | Repositório privado criado; autorização do CMS precisa de conferência | Backend GitHub documentado; usuários precisam de acesso ao repo ou solução de gateway |
| Salvar separado de publicar | Integração por ações de artigo e snapshot; não depende do campo status | Editorial workflow nativo gerencia drafts e publicação |
| Recuperação | Histórico nativo inspecionado abre GitHub; ação de recuperação implementada sem exigir SHA do editor | Workflow e histórico próprios precisam de prova real |
| Feedback de deploy | Ações exibem estado do workflow; sucesso só após verificar distribuição | Estado editorial e preview são nativos; deploy final precisa de integração |
| Autosave/aviso ao sair | Não comprovados; não prometer | Não presumidos nesta avaliação |
| Dependência adicional | Instância hospedada já usada; sem backend próprio | OAuth/gateway adicional para GitHub, a avaliar antes de trocar |

O código do Pages CMS inspecionado foi o commit 6f4e860a35d934406580287e7042e5e111e207a1. O histórico inspecionado está em components/entry/entry-history.tsx; as ações e seus estados em components/repo/repo-action-buttons.tsx. A versão hospedada precisa ser verificada na prova real.

Se o fluxo real exigir passos técnicos ou não mostrar retorno compreensível, a escolha permanece aberta. Não foi criado painel/CMS próprio nem contratado serviço pago.

## Modelo de conteúdo e publicação
- main privada: edição de trabalho pelo CMS. Salvar não inicia build/deploy.
- published privada: snapshot da última publicação confirmada. Não recebe merge de main.
- Tags privadas releases/<id>: candidatos aprovados por revisão, para histórico, rollback e reconciliação.
- Artigo é selecionado por caminho, commit e blob salvos fornecidos pela ação do CMS.
- Cada promoção modifica só o artigo solicitado; outros artigos permanecem iguais.
- Mídia aprovada recebe nome derivado do hash dos bytes; substituir um original não altera a imagem de outro artigo já publicado.
- Mídia vem da mesma revisão do artigo. Apenas imagens referenciadas são incluídas; originais nunca são copiados à pasta pública.
- Hashes selam cada arquivo e o manifesto. Arquivo extra, symlink, mídia sem uso, draft ou adulteração bloqueiam o build.
- Formulário principal: título, conteúdo, categoria, capa e resumo opcional. Slug, autor, canonical, SEO e datas são derivados quando omitidos; opções adicionais ficam agrupadas.
- Endereço inicial vem do nome gerado pelo CMS e permanece estável; mudanças explícitas de slug preservam aliases anteriores.
- Repetir uma publicação sem alteração não cria atualização de data nem outro build.
- Recuperar um salvamento restaura o texto e suas imagens na área de trabalho. Não altera a publicação no ar.

## Coordenador e autoridade
O workflow editorial privado aceita apenas ação explícita do CMS ou pedido do CI técnico autorizado. Não há gatilho push para artigos. A fila usa concurrency com queue:max e cancel-in-progress:false; até 100 pedidos podem aguardar, conforme GitHub. A ordem de execução não é suficiente: também rejeitamos revisões antigas do mesmo artigo e usamos fast-forward/CAS no published.

A distribuição usa versions upload sem alterar tráfego e a API de deployments para promover o ID exato. Falha no smoke tenta restaurar os pesos anteriores apenas se a versão ativa ainda for nossa. Falha da própria API pode impedir a restauração; nesse caso o fluxo reporta erro e exige a recuperação técnica documentada, sem confirmar publicação.

A sequência é selecionar → validar → construir uma vez → empacotar sem build duplicado → persistir candidato privado → enviar deploy → confirmar recibo e HTML/sitemap/404 → avançar published. Falha antes da confirmação não marca Publicado.

Se o processo cair depois de distribuir mas antes de registrar, a próxima execução repete o smoke antes de reconciliar o recibo público com a tag privada imutável. Divergência sem comprovação bloqueia novas publicações. Falhas sem deploy preservam a última distribuição válida. Uma falha posterior ao envio é reportada como distribuição não confirmada, sem anunciar sucesso.

O recibo público blog-release.json contém apenas ID e hashes do código/conteúdo aprovado; não contém caminhos, originais, corpo de drafts nem histórico editorial.

Mudanças do código só pedem publicação integrada após o job técnico passar em main. Um GitHub App com Actions write apenas no repo privado faz o dispatch; nenhum conteúdo privado volta ao CI público.

## Proteção durante a migração
O bootstrap privado foi integrado no [PR #1](https://github.com/DUGELO/calcmot-content/pull/1), em 05/11/2026, com autorização explícita do proprietário e CI privado aprovado. A configuração do CMS e os workflows estão na main privada. Nenhuma autoridade de produção foi transferida, segredo de serviço criado, merge do site ou deploy de produção executado.

O build de produção legado do Workers Builds é bloqueado pelo novo código, evitando um deploy sem artigos. A branch main que está em produção permanece intacta até aprovação do PR. Previews do código e CI público continuam sem acesso a conteúdo privado.

**Não aprovar o merge de transição antes de preparar e autorizar a troca de autoridade.** O proprietário precisa aprovar a configuração concreta descrita em OPERATIONS.md no repo privado; só então desabilitar o gatilho de produção legado e ativar o coordenador. A partir daí, publicações comuns não exigem outra aprovação técnica.

## Limites de homologação
- Formulário, botões, recuperação pela interface e estados percebidos pelo editor: pendentes de teste autenticado.
- Save + Publish com até duas ações: configuração preparada (confirm:false); meta ainda não medida.
- Retorno nativo de ações não prova que todos os estados desejados aparecem claramente no formulário. Validar Rascunho, alterações pendentes, publicando, publicado e erro com editor não técnico.
- Tempo até cinco minutos: meta não medida em produção. Builds locais e snapshots foram testados; isso não comprova tempo do serviço final.
- Preview baseline é o editor visual do CMS. Preview externo de drafts não foi criado; exigiria autenticação antes de qualquer distribuição.
- Agendamento permanece P2.
- Autorizações, branch protection/rulesets e segredos precisam ser conferidos pelo proprietário antes da ativação; não afirmar que já estão configurados.

## Fontes
- [Pages CMS actions](https://pagescms.org/docs/configuration/actions/)
- [Pages CMS campos e body](https://pagescms.org/docs/configuration/content/fields/)
- [Pages CMS colaboradores](https://pagescms.org/docs/configuration/collaborators/)
- [Decap editorial workflow](https://decapcms.org/docs/editorial-workflows/)
- [Decap GitHub backend](https://decapcms.org/docs/github-backend/)
- [GitHub concurrency/queue](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#concurrency)
- [Cloudflare Workers Builds e branches](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/)
