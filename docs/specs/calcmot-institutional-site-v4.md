# CalcMot — Site institucional V4

## Direção aprovada para implementação
Dark product-led para motorista, apoiado nas referências verificadas em template-discovery-v4.md. O produto e os números aparecem antes de explicações longas. H1: Pare de aceitar corrida no escuro.

## Composição
1. Hero split desktop, texto e CTA primeiro no mobile. A imagem principal é a captura real `offer-uber-live-cropped.jpg` (720 × 600), com UberX R$ 10,25 e aviso BOA; cartões externos repetem R$ 2,01/km, R$ 47,31/h e 13 min dessa própria captura. Imagem carregada cedo e sem moldura de telefone ilustrado.
2. Demonstração seguinte: `overlay-real-cropped.jpg` mostra outra oferta real, UberX R$ 8,75 com aviso BOA, R$ 2,13/km e R$ 47,73/h. Os dois arquivos públicos terminam antes da área de endereços.
3. Comparação solicitada: R$ 30, 42 min, 21 km, R$ 1,42/km, RUIM; R$ 14, 12 min, 4,8 km, R$ 2,91/km, ÓTIMA. Valores por km seguem truncamento do briefing; não declarar arredondamento. Estados ilustrativos, sem regra de meta incompatível.
4. Sequência da decisão: oferta aparece, conta aparece junto, motorista escolhe.
5. Quatro sinais atuais, ÓTIMA, BOA, MÉDIA e RUIM, ilustrados em HTML/CSS com exemplos numéricos e descrição curta. Não apresentam capturas reais adicionais.
6. Compatibilidade e confiança em bloco compacto; Android/Uber/99 textuais.
7. FAQ com cinco perguntas, somente primeira aberta.
8. CTA final solicitado.

## Limites
Sem alterações de SSR/build. Páginas futuras já existem; preservá-las. Sem novos recursos de produto. Não publicar. Nenhuma captura ou métrica comprova lucro. Não fazer claims de privacidade além dos limites solicitados.

## Acessibilidade e performance
Texto principal SSR, CSS simples, sem JS de animação, dimensões de imagens reservadas, foco visível, toque 48px e reduced motion. Hero com imagem real de 720 × 600, carregamento prioritário e sem animação sobre a foto. A segunda captura tem fallback explícito. Os dois arquivos não contêm endereços. Validar desktop e viewport mobile real do servidor; não chamar viewport emulado de aparelho físico.

## SEO
Title: CalcMot — veja R$/km e R$/h antes de aceitar corridas
Description: O CalcMot ajuda motoristas de app a visualizar R$/km, R$/h, tempo e classificação da oferta antes de decidir. Android, Uber e 99.

## Aceitação
qa:static e build verdes, serve:ssr ativo, sete verificações SSR verdadeiras. Auditar claims com negação explícita e relatar divergência dos testes literais. Capturas de navegador desktop e mobile, revisão visual de legibilidade e overflow. Sem alegar Core Web Vitals medidos sem medição.
