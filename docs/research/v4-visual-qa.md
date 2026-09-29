# V4 — revisão visual e validação final

Data: 25/09/2026. Inspeção feita no Angular SSR em http://localhost:4000/.

- QA estático e build final passaram. Bundle inicial: 380,97 kB; transferência estimada: 102,04 kB.
- Sete verificações do HTML SSR passaram. As cinco rotas públicas responderam HTTP 200 com `ng-server-context="ssr"`.
- Desktop: captura do servidor em 1440 × 900. Mobile: viewport 390 × 844 do navegador; não representa teste em aparelho físico.
- Menu verificado em 390 px e 320 px, sem clipping. Os CTAs mobile mantêm a mesma largura.
- O hero mostra uma captura real de UberX de R$ 10,25 com o aviso CalcMot BOA. A seção seguinte mostra outra captura real de UberX de R$ 8,75, também com BOA.
- Os quatro sinais de classificação são ilustrações HTML. Nenhuma medida de Core Web Vitals foi feita.

## Evidências

- `screenshots/v4-desktop-final.png`: captura final do servidor, viewport 1440 × 900.
- `screenshots/v4-mobile-final.png`: captura final do servidor, viewport de navegador 390 × 844.
- Os arquivos `v4-desktop-final.png` e `v4-mobile-final.png` foram sobrescritos em 25/09 após a implementação do hero com captura real e substituem as capturas antigas `v4-desktop.png` e `v4-mobile.png`.
