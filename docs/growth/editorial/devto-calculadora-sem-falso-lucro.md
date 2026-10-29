---
title: "Custo desconhecido não é zero: modelando uma calculadora de corridas em JavaScript"
published: false
description: "Um exemplo reproduzível com unidades inteiras, valores ausentes e limites explícitos."
tags: javascript, testing, webdev
---

Este tutorial nasceu de um material técnico preparado para o CalcMot, projeto ao qual este texto está vinculado. O código abaixo é uma implementação didática independente: não reproduz todos os limites nem integrações do aplicativo. Não usa dados reais de motoristas.

Uma divisão pode estar correta e o significado exibido estar errado. `receita / distância` produz receita por quilômetro. Chamar esse resultado de lucro ignora custos. Outro erro menos visível é converter um campo de custo vazio em zero: o programa passa a declarar um saldo que não tem informação para calcular.

Vamos construir uma função que trate esses dois problemas explicitamente, sem interface ou bibliotecas.

## Primeiro, o contrato

Dinheiro de receita e extras entra em centavos. Distância entra em metros, duração em minutos e custo em milésimos de real por km. A função recebe inteiros validados; converter entrada localizada como `"0,80"` pertence a outra camada. O tutorial não usa `parseFloat` para interpretar formulários brasileiros.

O limite didático é de um milhão de metros, 1.440 minutos, um milhão de centavos por operação e cem mil milésimos de real de custo por km. Isso mantém os produtos dentro da precisão inteira segura de Number. Em domínios maiores, essa hipótese deve ser revista.

Custo ausente é `null`. Custo explicitamente zero é `0`. Não se presume a receita de uma próxima corrida nem o trânsito do retorno.

## Uma função pura e executável

Salve este bloco como `exemplo.mjs` e execute com Node.js:

```js
import assert from 'node:assert/strict';

const inteiro = (nome, valor, min, max) => {
  if (!Number.isSafeInteger(valor) || valor < min || valor > max) {
    throw new RangeError(nome);
  }
  return valor;
};

function calcular({
  receitaCentavos,
  metros,
  minutos,
  custoMilesimos = null,
  extrasCentavos = 0,
}) {
  inteiro('receita', receitaCentavos, 0, 1_000_000);
  inteiro('distância', metros, 1, 1_000_000);
  inteiro('tempo', minutos, 1, 1_440);
  inteiro('extras', extrasCentavos, 0, 1_000_000);
  if (custoMilesimos !== null) {
    inteiro('custo/km', custoMilesimos, 0, 100_000);
  }

  const receitaPorKmCentavos = Math.round(
    receitaCentavos * 1_000 / metros
  );
  const receitaPorHoraCentavos = Math.round(
    receitaCentavos * 60 / minutos
  );

  const custoCentavos = custoMilesimos === null ? null :
    Math.round(metros * custoMilesimos / 10_000) + extrasCentavos;
  const saldoCentavos = custoCentavos === null ? null :
    receitaCentavos - custoCentavos;

  return {
    receitaPorKmCentavos,
    receitaPorHoraCentavos,
    custoCentavos,
    saldoCentavos,
    saldoPorHoraCentavos: saldoCentavos === null ? null :
      Math.round(saldoCentavos * 60 / minutos),
  };
}

// Tudo abaixo é uma fixture criada para este tutorial.
const entrada = {
  receitaCentavos: 3_000,
  metros: 24_000, // busca 3 km + viagem 15 km + retorno 6 km
  minutos: 60, // busca 8 + viagem 30 + espera 4 + retorno 18
  custoMilesimos: 800, // R$ 0,80/km, hipótese
  extrasCentavos: 300, // R$ 3, não incluídos no custo/km
};

assert.deepEqual(calcular(entrada), {
  receitaPorKmCentavos: 125,
  receitaPorHoraCentavos: 3_000,
  custoCentavos: 2_220,
  saldoCentavos: 780,
  saldoPorHoraCentavos: 780,
});

assert.equal(
  calcular({ ...entrada, custoMilesimos: null }).saldoCentavos,
  null,
);
assert.equal(
  calcular({ ...entrada, custoMilesimos: 0 }).saldoCentavos,
  2_700, // zero explícito ainda mantém os extras
);
assert.equal(
  calcular({ ...entrada, receitaCentavos: 1_000 }).saldoCentavos,
  -1_220, // saldo negativo é um resultado válido
);
assert.throws(
  () => calcular({ ...entrada, minutos: 0 }),
  RangeError,
);
assert.throws(
  () => calcular({ ...entrada, custoMilesimos: NaN }),
  RangeError,
);

console.log('Contrato e resultados verificados.');
```

O divisor 10.000 na conversão de custo vem das unidades: metros / 1.000 converte a distância em km; milésimos / 1.000 converte o custo em reais; multiplicar por 100 converte o resultado para centavos. Portanto, o produto dos dois inteiros é dividido por 10.000.

A função arredonda o custo da operação para centavos antes de subtrair. Essa regra deve ser documentada: arredondar cada quilômetro ou cada trecho separadamente pode produzir resultados diferentes. O exemplo só aceita valores de entrada não negativos, mas permite saldo negativo.

## O denominador precisa acompanhar a pergunta

No exemplo, dividir R$ 30 pelos 15 km com passageiro produz R$ 2/km. Dividir pelos 24 km da operação definida produz R$ 1,25/km. Não são medições conflitantes: são recortes diferentes.

A aplicação precisa mostrar qual recorte escolheu. Busca vazia e retorno vazio não são sinônimos. Retorno pode ser zero em um cenário e positivo em outro; não é uma previsão. Espera acrescenta tempo mesmo quando não acrescenta distância.

Para agregar um turno, some receitas e distâncias antes de dividir. A média simples de taxas de corridas pode dar peso igual a percursos de tamanhos muito diferentes. Para taxa horária do turno, use todo o tempo de trabalho definido, inclusive ociosidade se fizer parte da pergunta.

## Não esconda dados ausentes com formatação

Uma tela pode renderizar `null` como “Informe seu custo para estimar o saldo”. Usar `valor || 0` perde a diferença entre ausência e zero. Use comparação explícita com `null`, e trate erros de validação antes de calcular.

Mesmo com custo preenchido, prefira o rótulo “saldo após custos informados”. O número não vira lucro líquido apenas por estar em verde. Despesas omitidas, depreciação e remuneração do trabalho não são inferidas pela função.

## O que este exemplo não resolve

O código não estima consumo, impostos, demanda, trânsito ou tarifa justa. Ele não contabiliza um financiamento nem produz demonstrativo contábil. Extras precisam excluir despesas já cobertas no custo por km para evitar dupla contagem.

O [CalcMot](https://calcmot.com.br/) é um contexto de aplicação dessa discussão: seu site descreve estimativas de R$/km e R$/h como apoio à decisão do motorista. O tutorial adiciona uma operação hipotética com retorno e extras para ensinar modelagem, sem afirmar que o app identifica automaticamente esses dados.

Uma boa calculadora explica as unidades, a origem das entradas e o limite da resposta. O resultado mais útil às vezes é “ainda falta informação”.

<!-- Nota interna: rascunho original, não publicado. Revisar identidade do autor e executar o bloco antes de publicar. Os termos DEV em https://dev.to/terms exigem conteúdo substancial e vedam conteúdo criado principalmente para promoção ou backlinks. Este texto deve ser publicado apenas se o responsável desejar contribuir tecnicamente com a comunidade; não inserir CTA comercial, âncoras repetidas nem prometer link editorial. -->
