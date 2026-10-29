# Análise opcional da corrida com Gemini

A calculadora continua local. Somente o botão **Analisar com CalcMot** envia os campos numéricos e até 1.500 caracteres ao endpoint `POST /api/tools/ride-insights` do Worker existente. Não há banco, histórico de prompts ou dependência nova. A interface identifica a análise como Inteligência CalcMot e informa o uso do Google Gemini.

## Ativação

1. Configure a chave como segredo no Worker de destino: `npx wrangler secret put GEMINI_API_KEY`. Nunca coloque a chave em environment Angular, código ou arquivo versionado.
2. O binding `RIDE_AI_LIMITER` no `wrangler.jsonc` permite 3 tentativas por IP por minuto, por localização Cloudflare. Reserve o namespace 1002 para essa ferramenta na conta. Esse limite não substitui cotas e alertas de cobrança no projeto Google.
3. O modelo padrão é `gemini-flash-latest`, conforme solicitado; `GEMINI_MODEL` permite fixar uma versão compatível com structured outputs. O alias latest pode mudar de versão: valide o comportamento antes de publicar. Não fixamos parâmetros de thinking específicos de uma geração. Verifique disponibilidade e cotas no projeto Google.
4. Faça o deploy pelo fluxo Worker + Assets existente. Não publique somente os arquivos estáticos se quiser habilitar a análise. Confirme que o gateway não intercepta `/api/tools/ride-insights` antes deste Worker.
5. Teste uma análise real no domínio publicado e revise a política de tratamento de dados da conta Google utilizada. Os termos de uso e tratamento variam conforme o serviço contratado.

Sem chave ou binding, o endpoint retorna 503 com mensagem legível; o cálculo permanece disponível.

## Publicação validada — 28/10/2026

- Publicação manual autorizada pelo proprietário no Worker `calcmot-site`, com `CALCMOT_ADMIN_ENVIRONMENT=PROD` e `--keep-vars`.
- `GEMINI_API_KEY` configurado como segredo remoto, sem valor gravado no repositório. Modelo padrão `gemini-flash-latest`; binding `RIDE_AI_LIMITER` ativo.
- Versão publicada: `b652a763-504b-46a1-afb7-34e2080ba44c`. Versão anterior ao segredo e à entrega: `a47e0b09-4e88-49c7-a65c-6729461290af`.
- Seis páginas públicas HTTP 200 com H1 e canonical; ferramenta com conteúdo Inteligência CalcMot e preço mínimo no HTML inicial.
- Admin HTTP 200, PROD, no-store e noindex; sessão administrativa anônima HTTP 401/PROD. Não houve login, mutação administrativa ou troca de rotas do gateway.
- Análise real em `https://calcmot.com.br/api/tools/ride-insights`: HTTP 200, no-store e contrato válido. Cenário fictício particular de R$ 60: 80 km totais a R$ 0,75/km, 2,5 horas e meta de R$ 30/h após custos. Resposta: NÃO VALE A PENA, custo R$ 60, saldo zero e mínimo R$ 135; contas conferidas.
- Verificação reproduzível: `node scripts/verify-ride-production.mjs` (faz uma chamada real à IA, consumindo cota).
- Esta publicação usa o diretório de trabalho local. Antes de um futuro deploy automático via Git, incluir os arquivos desta entrega no fluxo de versionamento para não sobrescrever a feature com a versão anterior do repositório.

## Garantias e limites

O endpoint exige POST JSON da mesma origem, limita o corpo a 8 KiB, valida números e contexto, recalcula os indicadores no servidor, restringe a saída por schema e aplica timeout de 30 segundos (35 segundos no cliente). Texto da IA é renderizado como texto Angular, sem HTML. Editar os dados invalida a resposta anterior e cancela a espera no navegador. Cancelar no navegador não garante cancelamento de uma chamada já recebida pelo Google.

O prompt está em `cloudflare/ride-analysis-prompt.mjs`. A resposta contém veredito, diagnóstico, insights com impacto/ação/confiança, melhorias, preço/condições, próximo passo e até três perguntas. Sem meta ou custos suficientes, o prompt exige explicitar a insuficiência de dados. Valores de cenários extra são estimativas da IA e não substituem os indicadores calculados. Não há verificação matemática automática dos cenários gerados; revise-os antes de decidir. A orientação de negociação se aplica a serviço particular explicitamente informado, não à conversão de viagens de aplicativo.

A IA não consulta trânsito, demanda ou segurança de regiões. As sugestões são hipóteses para avaliação, sem metas de rentabilidade inventadas. O compartilhamento inclui receita, distância e tempo; exclui o texto pessoal e a resposta do Gemini.

Referências: [chaves Gemini](https://ai.google.dev/gemini-api/docs/api-key), [saída estruturada](https://ai.google.dev/gemini-api/docs/structured-output), [limites Cloudflare](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/), [Web Share](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share).
