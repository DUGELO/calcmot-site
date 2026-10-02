# Analytics e consentimento

## Configuração implementada

- Google Analytics 4: `G-EXVWE72E0G`.
- Microsoft Clarity: projeto `yrkr9mbz3r`.
- Hosts permitidos: `calcmot.com.br` e `www.calcmot.com.br`.
- GA4 e Clarity carregam somente no navegador, em produção, nos hosts autorizados. Não há banner, pergunta ao visitante, UI de preferências ou armazenamento local de consentimento.
- GA4 usa Consent Mode avançado com `analytics_storage`, `ad_storage`, `ad_user_data` e `ad_personalization` em `granted` desde o estado default. `ads_data_redaction` e os sinais de publicidade ficam nos padrões fornecidos pelas tags. Veja [Consent mode](https://developers.google.com/tag-platform/security/guides/consent) na documentação do Google.
- GA4 mantém `page_view` automático com medição otimizada de carregamentos e mudanças no histórico. Não enviar `page_view` manual para evitar duplicidade.
- Antes de carregar Clarity, enviar à fila `consentv2` os valores `analytics_Storage: granted` e `ad_Storage: granted`. O administrador deve habilitar Consent Mode no painel Clarity para todos os visitantes e configurar mascaramento estrito para conteúdo sensível, campos de formulário e dados pessoais.
- As integrações podem usar cookies e manter sessões persistentes.
- Sentry usa o DSN fornecido em `src/app/core/observability/sentry.config.ts`, com `@sentry/angular` 11.4.0, apenas para captura de erros nos hosts de produção. Tracing, replay, logs e métricas de aplicativo estão desativados.

## Etapas no painel

1. **GA4:** confirme que a medição otimizada está ativa para carregamentos de página, mudanças no histórico, cliques de saída e rolagem. O clique no link da Play Store mede uma saída para a loja; não comprova instalação do aplicativo. Depois da publicação, use Tempo real ou DebugView para conferir eventos ao navegar.
2. **Clarity:** habilite Consent Mode para todos os visitantes e masking estrito para conteúdo sensível, campos de formulário e dados pessoais.
3. **Search Console:** a propriedade já foi verificada por DNS; preserve o registro DNS de verificação. O envio do sitemap `https://calcmot.com.br/sitemap.xml` pelo painel ainda está pendente.
4. **Cloudflare Pages:** associe os domínios customizados do apex `calcmot.com.br` e `www.calcmot.com.br` ao projeto. Configure no painel o redirecionamento de `www` para o apex; não há redirecionamento no código da aplicação.
5. **Build/publicação:** antes de um build após alteração de rotas, rode `npm run seo:sitemap`. Depois use `npm run build` e publique `dist/calcmot-site/browser`, conforme [cloudflare-pages.md](cloudflare-pages.md). O destino de produção é o domínio canônico `https://calcmot.com.br`.

## Itens pendentes

- Confirmar no painel Sentry o plano Developer gratuito e o recebimento de erros após a publicação. Não foi enviado erro artificial à conta. Source maps não foram enviados; os frames de produção podem aparecer minificados.
- Firebase Crashlytics não oferece suporte à web e não faz parte desta configuração.
