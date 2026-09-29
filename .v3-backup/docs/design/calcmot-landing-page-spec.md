# CalcMot — Especificação de design da landing page

**Status:** direção visual e UX para implementação web  
**Fonte de verdade:** `docs/brand/calcmot_brand_book.md` e `docs/brand/calcmot_design_tokens_reference.md`  
**Princípio:** traduzir o app mobile atual para a web sem criar uma identidade visual nova.

## 1. Direção visual

### Ideia central

O CalcMot é um cockpit de decisão para o motorista. A landing page deve mostrar o instante em que uma oferta aparece, revelar os números que importam e devolver a decisão ao motorista.

**Narrativa visual:** oferta rápida → R$/km + R$/h + tempo → classificação → motorista decide.

### Sensação desejada

- dark-first, técnico e legível;
- operação real de rua, não ambiente bancário;
- contraste de cockpit: superfícies em camadas, números fortes e estados claros;
- tecnologia discreta, usada para reduzir dúvida;
- motorista no centro da decisão, nunca um robô tomando a ação.

### Composição

- canvas principal em `#04060A`;
- superfícies `#0B1016` e `#101720`, com bordas frias e discretas;
- um único foco de atenção por viewport: CTA azul ou overlay;
- respiro generoso entre blocos, sem parede de cards;
- mockups de telas reais/anonimizadas sempre que disponíveis;
- glows radiais suaves apenas para dar profundidade ao hero e ao CTA final.

### Evitar

Fintech genérica, banco, neon excessivo, hacker, promessa de renda, “dashboard” abstrato, fotografia de motorista sorrindo para a câmera, logos que indiquem parceria oficial e mockups que pareçam controlar Uber/99.

## 2. Arquitetura da página

1. Header compacto com wordmark real e CTA de download.
2. Hero: “Pare de aceitar corrida no escuro.”
3. Problema: valor bruto não conta toda a história.
4. Demonstração principal do overlay.
5. Classificações ÓTIMA / BOA / MÉDIA / RUIM.
6. Como funciona em quatro passos.
7. Compatibilidade com Uber e 99, sem sugerir afiliação.
8. Evolução para cockpit financeiro-operacional.
9. Privacidade e controle.
10. Prova de transparência: o que o CalcMot não faz.
11. FAQ.
12. CTA final para a Play Store.
13. Footer com posicionamento e aviso “Não é oficial da Uber/99”.

A ordem é intencional: primeiro a dor e a prova visual, depois funcionamento, escopo, confiança e conversão.

## 3. Wireframe textual — mobile first

Largura-base: 320–767 px. Uma coluna, padding horizontal de 16 px e alvo de toque mínimo de 48 px.

```text
[header]
  [wordmark]                         [Baixar]

[hero / 1 viewport principal]
  eyebrow: O cockpit financeiro-operacional...
  H1: Pare de aceitar corrida no escuro.
  texto: R$/km, R$/h, tempo e classificação...
  [Baixar na Play Store]             ← CTA primário
  [Ver como funciona]                ← secundário
  nota: não aceita / não recusa / não controla
  mockup do telefone com overlay ÓTIMA
  Android · Uber e 99 · a decisão continua sua

[problema]
  H2: O valor da corrida não conta a história toda.
  texto curto
  3 benefícios em sequência vertical

[overlay]
  H2: R$/km, R$/h e uma decisão mais rápida.
  chips: R$/km · R$/h · Tempo · ÓTIMA
  mockup ou captura real do overlay
  legenda: “exemplo visual” + “comparado à sua meta”

[classificações]
  H2: ÓTIMA, BOA, MÉDIA ou RUIM
  4 badges empilhados, cada um com rótulo e significado textual
  [Baixar na Play Store]

[como funciona]
  H2: Como funciona
  01 Abrir o app
  02 Oferta visível
  03 Cálculo
  04 Motorista decide

[compatibilidade]
  [Uber] [99]
  texto: não oficial da Uber/99

[cockpit]
  H2: Do semáforo ao cockpit...
  mockup parcial ou lista de módulos:
  Metas · Histórico · Custos · Ganhos confirmados · Comparações · Relatórios

[privacidade]
  H2: Você mantém o controle.
  resumo de leitura local / espera / histórico opcional
  3 bullets com check textual

[transparência]
  4 linhas “Não aceita”, “Não recusa”, “Não controla”, “Não promete”

[faq]
  accordion nativo, primeiro item aberto

[cta final]
  H2: CalcMot: clareza para quem decide no volante.
  [Baixar na Play Store]

[footer]
  posicionamento · não oficial Uber/99
```

No mobile, o mockup vem depois do texto e do CTA do hero, mas antes das seções explicativas: a pessoa entende a promessa e imediatamente vê o produto.

## 4. Wireframe textual — desktop

Largura de conteúdo: `min(100% - 64px, 1160px)`. Breakpoint principal a partir de 900–960 px; grid de 12 colunas quando houver composição complexa.

```text
[header 72–80 px]
  [wordmark]  Como funciona · Classificações · Privacidade · FAQ  [Baixar]

[hero 2 colunas]
  [5–6 colunas] eyebrow / H1 / descrição / CTAs / confiança
  [6–7 colunas] telefone Android + overlay destacado

[problema]
  [heading largo]
  [3 cards horizontais]

[overlay 2 colunas]
  [texto + chips + legenda]             [mockup grande]

[classificações]
  [heading]                             [4 estados em linha]
  CTA alinhado à esquerda

[como funciona]
  [01]──[02]──[03]──[04]

[compatibilidade 2 colunas]
  texto + aviso                         [Uber] [99]

[cockpit 2 colunas]
  [mockup/resumo financeiro]            texto + módulos

[privacidade 2 colunas]
  texto                                 lista de controles

[transparência]
  heading à esquerda                    2 × 2 itens

[faq 2 colunas]
  heading sticky                        accordion

[cta final centralizado]
[footer]
```

Em desktop, o telefone deve ter escala suficiente para o overlay ser lido sem zoom. Não usar duas imagens grandes competindo na mesma dobra.

## 5. Componentes web necessários

### Fundação

- `SiteHeader`: wordmark, navegação âncora, CTA e estado de foco.
- `SectionHeader`: eyebrow, título e descrição com largura controlada.
- `CtaButton`: `primary` e `secondary`, link externo seguro, altura mínima de 48 px.
- `SkipLink`: primeiro elemento focável.
- `SiteFooter`: posicionamento e aviso de não afiliação.

### Produto e conversão

- `PhoneMockup`: moldura Android, captura aprovada ou fallback explícito “exemplo visual”.
- `OverlayDemo`: oferta de fundo + painel semitransparente + métricas + estado.
- `ClassificationBadge`: `great`, `good`, `warning`, `bad`; sempre combina cor, rótulo e descrição.
- `FeatureCard`: benefício curto, sem card aninhado.
- `StepList`: sequência numerada de 4 etapas, com linha de conexão apenas em desktop.
- `CompatibilityBadge`: nome textual de plataforma e aviso de não parceria.
- `CockpitPreview`: módulos de meta, histórico, custo e ganho; marcar `estimado`, `confirmado` ou `informado por você`.
- `PrivacyList`: limites de atuação e controles do motorista.
- `FaqAccordion`: usar `details/summary` ou equivalente com teclado e estado anunciado.

### Dados e conteúdo

Manter copy, URLs e tokens fora dos templates. Dados de mockup devem ser fictícios ou anonimizados e sempre marcados como exemplo. Não apresentar screenshot, dashboard ou recurso WIP como disponibilidade confirmada.

## 6. Sistema de cards, badges, botões e mockups

### Cards

| Elemento | Regra |
| --- | --- |
| Card padrão | `#0B1016`, borda sutil, raio 10–16 px, padding 16–24 px |
| Card elevado | `#101720`, usar apenas para status, hero interno ou CTA final |
| Card de estado | tonalidade semântica de baixa opacidade + rótulo textual |
| Elevação | sombra baixa e larga; a borda faz a maior parte da separação |
| Conteúdo | uma ideia por card; não colocar card dentro de card |

### Badges

Pílula ou bloco compacto, com `label` em caixa alta e uma segunda linha semântica. A cor é um reforço; “ÓTIMA — Muito acima da meta” precisa continuar compreensível em escala de cinza.

### Botões

- Primário: fundo `#1768F9`, texto `#F7F7F7`, raio 10 px, peso 700–800.
- Hover/pressed: `#0F55D9`; movimento de no máximo 1 px.
- Secundário: transparente ou `#101720`, borda forte e texto primário.
- Um CTA primário por grupo; no hero, somente “Baixar na Play Store”.
- Verde comunica pronto/sucesso, não deve virar segundo botão de aquisição.
- Roxo não é botão padrão.

### Mockups

- telefone realista, mas contido; sem perspectiva dramática;
- overlay é o ponto de foco, não um painel financeiro genérico;
- anatomia: badge → significado → impacto/meta → R$/km → R$/h + tempo;
- fundo do mockup sugere uma oferta visível, sem reproduzir interface protegida ou insinuar controle;
- incluir “exemplo visual” quando os números não forem dados reais;
- preferir captura real aprovada e anonimizada ao fallback CSS.

## 7. Uso de `#9C2A9A` sem competir com o CTA azul

`#9C2A9A` representa exclusivamente o estado `ÓTIMA`/premium e momentos de performance superior. Ele não deve ser tratado como cor de marca dominante.

### Permitido

- badge `ÓTIMA` no overlay;
- borda, halo e preenchimento semitransparente do mockup em estado ÓTIMA;
- chip de classificação na demonstração;
- pequeno acento em uma visualização de performance premium;
- estado selecionado de uma classificação, sempre acompanhado do texto.

### Limites de composição

- reservar o azul para links, foco, ações e CTA de download;
- usar o roxo em uma área de produto por vez, não na página inteira;
- manter baixa opacidade em superfícies: `color-mix(... 8–24%, surface)`;
- não aplicar roxo em H1, nav, todos os ícones ou fundo de seção;
- não usar roxo para “sucesso” genérico: sucesso/prontidão é verde;
- em estados `BOA`, `MÉDIA` e `RUIM`, seguir a semântica própria e não gradear tudo para roxo.

### Regra rápida

Se o elemento pede clique, é azul. Se o elemento informa “muito acima da meta”, é roxo. Se confirma prontidão ou ação concluída, é verde.

## 8. Acessibilidade e contraste

### Checklist de implementação

- [ ] HTML semântico: `header`, `nav`, `main`, `section`, `footer`, headings em ordem.
- [ ] Um único `h1`; cada seção tem `aria-labelledby` ou heading visível.
- [ ] Skip link visível ao receber foco.
- [ ] Foco visível em links, botões, `summary` e controles customizados.
- [ ] Alvos interativos com pelo menos 44–48 px de altura/largura.
- [ ] Contraste de texto normal em nível WCAG AA; validar cada combinação real de superfície.
- [ ] Não depender só de cor: rótulo, ícone ou texto acompanha todo estado.
- [ ] `TextMuted` não pode carregar instrução essencial nem disclaimer crítico.
- [ ] Métricas preservam `R$/km`, `R$/h`, acentos e unidades em zoom de 200%.
- [ ] Layout funciona com fonte ampliada, reflow e viewport de 320 px.
- [ ] Imagens têm alt útil; mockups decorativos usam `aria-hidden`; não duplicar texto da imagem.
- [ ] Accordion opera por teclado e anuncia expansão/recolhimento.
- [ ] Links externos da Play Store usam `target=_blank` apenas quando desejado e `rel=noopener noreferrer`.
- [ ] Respeitar `prefers-reduced-motion`; sem scroll hijacking ou parallax obrigatório.
- [ ] Testar modo de alto contraste/forced colors e navegação sem mouse.
- [ ] Revisar contraste do roxo e amarelo em `#0B1016` e `#101720`; se falhar, usar a cor como borda/indicador e texto claro separado.

## 9. Estrutura CSS / Tailwind / design tokens

O projeto atual usa SCSS. A mesma arquitetura pode ser expressa em Tailwind sem mudar os valores.

### Tokens CSS recomendados

```scss
:root {
  --cm-bg: #04060a;
  --cm-surface: #0b1016;
  --cm-surface-elevated: #101720;
  --cm-surface-soft: #141a22;

  --cm-blue: #1768f9;
  --cm-blue-dark: #0f55d9;
  --cm-green: #61e329;
  --cm-great: #9c2a9a;

  --cm-text: #f7f7f7;
  --cm-text-secondary: #b9bbc2;
  --cm-text-muted: #8e929b;
  --cm-border-subtle: #4d596633;
  --cm-border-strong: #5f6e7d66;

  --cm-radius-sm: 10px;
  --cm-radius-md: 16px;
  --cm-radius-lg: 20px;
  --cm-radius-xl: 28px;

  --cm-space-1: 4px;
  --cm-space-2: 8px;
  --cm-space-3: 12px;
  --cm-space-4: 16px;
  --cm-space-6: 24px;
  --cm-space-8: 32px;
  --cm-space-12: 48px;
  --cm-space-16: 64px;

  --cm-motion-fast: 120ms ease;
  --cm-motion-medium: 180ms ease;
  --cm-motion-slow: 250ms ease;
}
```

### Camadas SCSS

```text
styles.scss                 // reset, tokens, tipografia, container, section, focus
landing/
  landing-page.component   // composição e footer
  hero/                    // promessa + CTA + mockup
  overlay-demo/            // demonstração do ativo principal
  classification/          // semântica de estados
  ...                      // uma pasta por seção
shared/components/
  cta-button/              // ação
  phone-mockup/            // produto
  classification-badge/    // estado
  feature-card/            // benefício
```

### Equivalentes Tailwind

Mapear `bg-cm-bg`, `bg-cm-surface`, `bg-cm-elevated`, `text-cm-primary`, `text-cm-secondary`, `text-cm-muted`, `border-cm-subtle`, `text-cm-blue`, `bg-cm-blue` e `text-cm-green` no tema. Os estados `great/good/warning/bad` devem ser tokens semânticos, não classes de cor aplicadas ad hoc.

### Responsividade

- base: coluna única, 16 px de gutter;
- `min-width: 560px`: CTAs lado a lado quando houver espaço;
- `min-width: 768px`: padding vertical de seção entre 84–128 px;
- `min-width: 900px`: grids de conteúdo e mockup em duas colunas;
- `min-width: 1100px`: classificação em quatro colunas;
- reduzir simultaneamente tamanho de mockup e gap, nunca cortar conteúdo.

## 10. Critérios de aceitação visual e de conversão

- A headline e o CTA principal são compreendidos antes da dobra.
- O visitante vê um overlay legível sem precisar interpretar uma tela fake.
- A diferença entre “estimado” e “confirmado” aparece onde houver dados financeiros.
- A página explica claramente que o CalcMot não aceita, recusa, toca ou controla apps.
- O azul domina a ação; o roxo aparece como um evento raro de performance.
- Cada seção tem uma mensagem e uma ação implícita claras.
- Nenhum claim sugere lucro garantido, parceria com Uber/99 ou automação clandestina.
- Hero, overlay e CTA final funcionam em 320 px, desktop largo, teclado, zoom e reduced motion.
- Conteúdo e URLs podem ser alterados nos constantes sem reescrever templates.

