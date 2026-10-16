# Release checklist — Calculadora interativa (WEB-01 a WEB-06)

## Implementado
- Rota prerenderizada `/ferramentas/corrida-vale-a-pena/`, canonical, título, descrição, JSON-LD e sitemap.
- Motor de cálculo determinístico, validação, limites e testes automatizados (`npm run test:calculator`).
- Formulário responsivo, métricas, custos opcionais e saldo estimado sem alegar lucro garantido.
- Analytics agregados sem valores financeiros; máscara Clarity nos inputs e painel de resultados.
- Links internos, CTA Play Store, compartilhamento e captura real WebP 440×355 com lazy loading.
- GitHub Actions: QA estático, testes financeiros, build, prerender e artifact HTML.

## Evidências
- CI anterior ao hardening: https://github.com/DUGELO/calcmot-site/actions/runs/38976615746 (sucesso).
- Captura `src/assets/screenshots/offer-real-q90.webp` presente no artifact HTML.
- Inspeção estática do artifact confirmou título, canonical, metadados, seis URLs no sitemap, seis campos e screenshot válido.

## Condições para publicar
1. CI do **último commit** precisa estar verde, inclusive novo hardening de privacidade.
2. **Workers Builds: calcmot-site** deve passar (última verificação externa do commit anterior falhou). Inspecionar logs de Cloudflare para identificar erro; CI do GitHub não equivale a deploy aprovado.
3. Revisão visual/mobile em URL de preview navegável (teste em Chromium local foi bloqueado por política do ambiente, portanto não atestar homologação visual).
4. Revisar PR #1 (CI/PRD) em direção à `main` e fazer merge dele primeiro; depois alterar a base do PR #2 para `main`, revisar diff e aprovação, fazer merge separado.

## Guardrails
- Não fazer merge automático e não mexer na configuração de deploy principal.
- Resultado de ferramentas e screenshots não implica relação oficial com Uber/99.
- Se o build hospedado falhar, não liberar antes de diagnosticar.
