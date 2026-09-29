# AI Site Guardrails — CalcMot

Você está implementando o site institucional do CalcMot.

## Não negociar

- Não alterar Angular SSR.
- Não alterar server.ts, main.server.ts ou app.routes.server.ts sem pedido explícito.
- Não alterar a URL da Play Store.
- Não alterar o nome público CalcMot.
- Não alterar #9C2A9A como cor de ÓTIMA.
- Não inventar depoimentos, notas, downloads, reviews ou métricas.
- Não usar logos de Uber/99 como se houvesse parceria.
- Não prometer lucro garantido.
- Não dizer que o app aceita ou recusa corridas.
- Não dizer que o app controla Uber/99.
- Não usar linguagem de hack/robô/burlar.
- Não criar backend.
- Não adicionar bibliotecas sem justificar.
- Não transformar a homepage em texto institucional longo.

## Obrigatório em toda alteração

- Preservar build.
- Preservar SSR.
- Preservar CTA Play Store.
- Preservar linguagem humana e concreta.
- Preferir produto real a ilustração genérica.
- Marcar simulações como “exemplo visual”.
- Usar componentes e tokens existentes.

## Definição de pronto

- npm run qa:static passa.
- npm run build passa.
- serve:ssr sobe.
- HTML inicial contém headline, CTA, Play Store URL e ng-server-context="ssr".
- Não contém termos proibidos.

