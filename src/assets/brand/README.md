# CalcMot brand assets

Use only approved, real CalcMot assets here. Do not generate replacement brand art for production.

Expected optional files:

- `app-icon.png` — local copy of the real published CalcMot app icon. When this file is added, the favicon links in `src/index.html` can be changed from the official Play Store asset URL to `/assets/brand/app-icon.png`.
- `og-image.png` — dedicated approved social-sharing image. Do **not** add `og:image` metadata until this real asset exists and the public absolute URL is known.

The current V3 favicon uses the real icon served by the official Google Play listing because no local brand image file is present in this repository snapshot.

## Assets reais recebidos (outubro/2026)

- `calcmot-logo-512.png` e `calcmot-logo-hero.png`: originais reais fornecidos pelo proprietário, 512×512. Preservar proporções e não substituí-los por ilustrações geradas.
- `calcmot-icon.png`: ícone local já existente e usado para favicon/touch icon; não renderizar o logo 512px no LCP da home desnecessariamente.
- `growth_share_community_3d.webp`: asset fornecido pelo proprietário, mas reservar para uma futura superfície específica de comunidade/indicação; não poluir home/calculadora por ser decorativo.
- A captura da oferta de R$ 40,76, enviada como PNG 440×355, deve entrar exclusivamente como evidência de oferta real, com dimensões exatas, loading lazy e legenda clara; nunca substituir a captura priorizada no hero da home nem trocar exemplos numéricos desacompanhados da imagem.
