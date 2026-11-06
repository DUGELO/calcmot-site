# Quanto sobra de uma corrida: metodologia reproduzível

Material editorial original — 29/10/2026. Todos os números abaixo são hipóteses didáticas criadas para este material. Não são preços vigentes, médias de mercado, dados de usuários ou promessa de renda. O CSV anexo permite reproduzir as contas.

## Defina a operação antes de dividir

Uma oferta de R$ 30 para transportar um passageiro por 15 km não descreve necessariamente toda a operação. Se buscar a pessoa exige 3 km e retornar sem passageiro exige outros 6 km, o denominador é 24 km. Se a busca leva 8 minutos, a viagem 30, a espera 4 e o retorno 18, o tempo comprometido é uma hora.

Neste cenário hipotético, R$ 30 ÷ 15 = R$ 2/km descreve apenas o trecho ocupado. R$ 30 ÷ 24 = R$ 1,25/km descreve a operação definida. Nenhuma das duas divisões é lucro.

Use receita efetivamente destinada ao motorista, depois das retenções já descontadas no valor informado. Não desconte a mesma taxa duas vezes. Reembolsos e despesas cobertas pelo passageiro precisam de tratamento consistente; não some um reembolso como ganho livre e omita sua despesa correspondente.

## Fórmulas e unidades

- D = busca + viagem + retorno vazio, em km.
- T = busca + viagem + espera + retorno, em minutos.
- Receita por km = R / D.
- Receita por hora = 60 × R / T.
- Custo incluído = D × c + E, em reais.
- Saldo estimado = R − D × c − E.
- Saldo estimado por hora = 60 × saldo / T.
- Receita mínima para uma meta após custos de H reais/h = D × c + E + H × T / 60.

E contém apenas extras ainda não incluídos em c. Distância e tempo devem ser positivos. Custo desconhecido produz saldo desconhecido, nunca custo zero implícito. Meta ausente não autoriza classificar uma corrida como boa ou ruim.

O cenário A do CSV usa D=24, T=60, c=0,80 e E=3. Seu custo incluído é R$ 22,20 e o saldo é R$ 7,80. Uma meta hipotética de R$ 20/h após esses custos exige receita de R$ 42,20. Isso não é tarifa de mercado nem recomendação universal.

O cenário B mantém receita de R$ 30, mas tem D=18 e T=42. A receita por km sobe para aproximadamente R$ 1,67 e o saldo por hora fica em R$ 18,00. A comparação isola o efeito dos trechos e tempos adicionais; não prevê disponibilidade de uma próxima corrida.

## Monte seu custo com o mesmo período de referência

Combustível por km = preço efetivamente pago por litro ÷ consumo medido em km/l. Exemplo exclusivamente hipotético: R$ 6/l ÷ 12 km/l = R$ 0,50/km. Isso ainda não inclui pneus, manutenção, impostos, seguro ou depreciação.

Para despesas periódicas, distribua o valor atribuído ao trabalho pelos quilômetros de trabalho do mesmo período. Declare como separou uso pessoal e profissional. Para pneu, pode-se usar custo do conjunto dividido pela vida útil estimada; não some novamente o mesmo gasto em uma reserva geral de manutenção. Depreciação exige uma hipótese explícita e pode mudar muito o saldo econômico.

Não trate prestação de financiamento e depreciação como se fossem sempre custos econômicos independentes: a parcela pode conter amortização de principal e juros. Fluxo de caixa e resultado econômico respondem perguntas diferentes. O modelo deste texto não faz apuração contábil ou tributária.

## Por que chamar de saldo, e não lucro líquido

O resultado desconta apenas os itens incluídos. Se o custo cobre só combustível, trata-se de saldo após combustível. Se remuneração do trabalho, depreciação ou tempo ocioso ficaram de fora, eles não desapareceram. Para analisar o turno, some receitas e despesas e inclua todo o tempo de trabalho, inclusive espera entre ofertas. Não faça média simples de taxas por corrida: divida receitas totais por quilômetros totais e por horas totais.

## Limite do retorno vazio

Um retorno de 6 km é uma hipótese de cenário. Não assuma retorno vazio obrigatório em toda corrida nem retorno remunerado garantido. Compare cenários com e sem retorno e registre a incerteza. A estimativa não consulta trânsito nem prevê demanda.

## Material para apuração e reprodução

O arquivo `cenarios-hipoteticos.csv` usa ponto decimal, unidades nos cabeçalhos e resultados esperados em centavos. `node docs/growth/editorial/verificar-cenarios.mjs` verifica todas as linhas. Arredonde na apresentação; não some taxas já arredondadas para reconstruir o total.

Para contextualizar preços reais, consulte a [pesquisa oficial de preços da ANP](https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos), anotando combustível, localidade e período; não substitua o recibo e o consumo do próprio veículo por uma média nacional.

O [CalcMot](https://calcmot.com.br/) apresenta estimativas de R$/km e R$/h para apoiar a decisão do motorista. O site descreve Android e compatibilidade com Uber e 99, sujeita a variações. Não aceita ou recusa corridas, não é oficial das plataformas e não garante lucro. Esta metodologia editorial é mais ampla que o cálculo simples de uma oferta; não atribui ao aplicativo a coleta automática de retorno vazio, depreciação ou custos reais.

## Verificação de produto

Fontes consultadas em 29/10/2026: [site](https://calcmot.com.br/), [suporte](https://calcmot.com.br/suporte/), `src/app/core/calculator/ride-calculator.ts` e `src/app/core/constants/pages/calculadora.copy.ts`. O motor local soma busca e viagem, mantém custo desconhecido como null e calcula saldo com o custo informado. A ficha [Google Play](https://play.google.com/store/apps/details?id=br.com.calcmot) não pôde ser lida nesta pesquisa; versão, preço, avaliações e número de instalações não foram confirmados nem usados.
