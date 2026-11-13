# QA do ciclo 05/11/2026

- node --test tests/growth/*.test.mjs: 31 testes aprovados.
- npm run qa:static: aprovado.
- npm run build: aprovado; seis rotas pré-renderizadas.
- Verificador dos quatro cenários hipotéticos: aprovado.
- Ciclo real executado com checkpoint: recuperação, descoberta e quatro triagens por lote; escrita externa zero no runner. Descoberta inicialmente retornou HTTP 415, corrigido com o Accept JSON recomendado pelo GitHub; a retomada importou leads sem elegibilidade presumida.
- Três propostas individuais enviadas pelo conector Gmail: Fala Motorista, Motor1 Brasil e Portal Auto Mulher, com intenção prévia, consulta de duplicidade e recibos SENT.
- IndexFlow: HTTP 402 na tentativa de hoje; última prova válida de 29/10 preservada. Zero links novos ou reconfirmados hoje; um domínio histórico com situação atual desconhecida.

Cobertura adicional: sufixos com.br/co.uk, regras wildcard/exceção/IDN e PRIVATE da PSL; subdomínios relacionados; páginas duplicadas e páginas próprias excluídas; distinção entre histórico e reconfirmação; checkpoints atômicos, leases, backoff e resultado incerto de envio sem reexecução; falha de uma tarefa sem interromper descoberta independente.

As fases de qualificação automática são somente triagem e a execução no Actions é fila de integração autorizada; nenhum adaptador externo está habilitado no workflow. Os testes não comprovam aprovação, entrega de e-mail, indexação ou tráfego.

A validação remota do YAML/Actions será registrada depois do push. Não foi instalado um parser YAML adicional só para a revisão local. As configurações de build e SSR e mudanças administrativas preexistentes permanecem fora do commit de growth.
