# QA — operação de growth

Validação em 29/10/2026 no workspace compartilhado:

- `node --test tests/growth/*.test.mjs`: 18 testes aprovados na execução final.
- `npm run qa:static`: aprovado.
- `npm run build`: aprovado, com seis rotas pré-renderizadas.
- `node docs/growth/editorial/verificar-cenarios.mjs`: quatro cenários hipotéticos aprovados (saldos R$ 7,80; R$ 12,60; R$ 10,00; R$ -2,80).
- `node scripts/growth-audit.mjs growth-qa-report.md`: executado sobre os 19 registros do inventário; os arquivos temporários foram removidos.

A revisão cobre deduplicação por ID e URL normalizada, bloqueios de destinos privados e redirecionamentos, correspondência exata do domínio no HTML, atributos de links, histórico de perda e classificação de erros temporários. Os testes são offline; eles não demonstram disponibilidade atual dos sites, indexação, tráfego nem publicação real. O workflow agenda somente verificação e geração de artefatos; não envia propostas.

A verificação de backlink examina HTML recebido, não executa JavaScript e pode não detectar links renderizados no cliente. Ausência em HTML de resposta 200 ou HTTP 404/410 é tratada como perda; bloqueios, respostas não HTML e erros temporários não a confirmam. Revisão de robots e indexação depende de fontes externas.

Na execução final, o relatório identificou 25 registros: 16 leads sem qualificação comprovada e nove oportunidades qualificadas. O ledger registrou nove ações confirmadas (quatro formulários e cinco propostas por email), oito ações bloqueadas e um backlink verificado em IndexFlow. Estes números são um retrato da execução e podem mudar em ciclos posteriores.

Para contar uma oportunidade qualificada, `qualification` exige `eligible: true`, `url`, `checkedAt` e `note`. Publicação declarada e backlink confirmado são medidas separadas; `link_confirmed` exige verificação HTTP 200 com URL final, domínio e data. Confirmação no ledger exige evidência e URL de origem ou confirmação; protocolo é opcional. O estado `awaiting_review` no tracker exige URL e nota de evidência; protocolo é opcional.

Os arquivos `launching-next-prepared.jpg` e `saasolution-submitted.jpg` foram confirmados como ignorados por `docs/growth/evidence/.gitignore`. Alterações preexistentes em admin e package estão fora do escopo de growth e não foram revisadas como parte deste QA.
