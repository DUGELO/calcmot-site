# feat(admin): painel DEV com Firebase e publicação pelo Worker existente

Adiciona `/admin` ao Angular oficial para consultar e avaliar solicitações DEV com Firebase Google e API same-origin `/api/admin/v1`, conforme contrato S06 Admin Web 1.2.0. A interface usa feature lazy/CSR, componentes smart/dumb, formulários tipados e assets oficiais. Aprovação e emissão são etapas distintas; reautenticação nunca repete uma operação automaticamente.

O Worker preserva ASSETS-first e SSR/SSG das seis páginas públicas. Admin recebe shell CSR, no-store/noindex e CSP específica; aliases não servem o painel e `/api` nunca recebe fallback HTML. Os domínios existentes são declarados na configuração e o gateway DEV permanece independente.

A publicação continua exclusivamente pelo fluxo existente `main → Cloudflare Worker Builds → npm run build → npx wrangler deploy`. A versão do Wrangler é fixada no lockfile; o build neutral fica num workspace temporário sem alterar os arquivos SSR originais. O CI valida testes administrativos e o bundle do Worker com dry-run. O deploy opcional paralelo em Pages foi retirado; o artifact do PR permanece.

Validação local:
- QA estático/arquitetural, TypeScript estrito e 26 testes administrativos.
- Roteamento edge, motor financeiro e atribuição de conversões.
- Build padrão e neutral, empacotamento dry-run e workerd/Assets local.
- Seis páginas públicas, canonical, sitemap e ausência de fixtures no build integrado.
- Bundle inicial público: 485,36 → 440,24 kB; isso não representa o total após carregar monitoramento lazy.

Limites: o simulador local suporta compatibilidade 13/10; produção mantém 19/10. Checks browser públicos/mobile/analytics continuam no CI. Login/conta negada/logout/reauth/CSP e consultas reais Angular same-origin serão homologados após merge autorizado e deploy automático. Nenhum POST administrativo remoto ou novo grant foi executado.

Base preservada: main `2f89a6d`. Pipeline remoto original foi restaurado e conferido após reload; produção permanece `8787f096-328f-41a7-b7f7-e9e22c0ada71`. Não houve upload de nova versão nem ativação. Procedimento e rollback: `docs/admin/CUTOVER.md`.

Merge depende de autorização explícita do proprietário. Esta preparação não autoriza push, merge ou deploy manual.
