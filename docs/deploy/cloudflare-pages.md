# Deploy estático no Cloudflare Pages

## Objetivo

Publicar o CalcMot no Cloudflare Pages Free como site estático, sem executar o SSR com Node em produção. O projeto mantém o servidor Angular SSR para uso local; as páginas públicas listadas em `src/app/app.routes.server.ts` são geradas como HTML estático durante o build.

## Configuração de build

- **Build command:** `npm run build`
- **Output directory:** `dist/calcmot-site/browser`
- **Versão do Node:** `22.16.0`, conforme `.nvmrc` (configure `NODE_VERSION` com esse valor nas variáveis de ambiente de build, se necessário).

O Angular também cria arquivos de servidor em `dist/calcmot-site/server` para o uso local de SSR. O Pages deve publicar somente `dist/calcmot-site/browser`; não é necessário iniciar `server.mjs`.

## Validar o HTML prerenderizado localmente

Na raiz do repositório, execute:

```powershell
npm run build
$html = Get-Content ".\dist\calcmot-site\browser\index.html" -Raw
$html.Contains("Pare de aceitar corrida no escuro.")
$html.Contains("Android · Uber e 99 · A decisão continua sua")
$html.Contains("https://play.google.com/store/apps/details?id=br.com.calcmot")
```

As três expressões devem retornar `True`. O HTML de `app-root` também deve conter o conteúdo da home, em vez de estar vazio. Para confirmar as demais páginas, confira `dist/calcmot-site/browser/como-funciona/index.html`, `calculadora-ganhos-motorista-app/index.html`, `privacidade/index.html` e `suporte/index.html`.

## Configurar o Cloudflare Pages

1. Envie o repositório para GitHub ou GitLab e, no painel Cloudflare, abra **Workers & Pages** e crie um projeto Pages conectado ao repositório.
2. Selecione o framework Angular (ou configure manualmente os campos abaixo).
3. Configure `npm run build` como build command e `dist/calcmot-site/browser` como build output directory.
4. Configure `NODE_VERSION` como `22.16.0` nas variáveis de ambiente de build, se o ambiente não respeitar o `.nvmrc` automaticamente.
5. Escolha a branch de produção e salve. O Pages instalará dependências e publicará cada build nessa branch; commits e pull requests poderão gerar deploys de produção e preview.
6. Abra a URL `*.pages.dev` do projeto e teste a home e as rotas institucionais diretamente, incluindo recarregar uma rota interna.

## Adicionar domínio customizado depois

No projeto Pages, abra **Custom domains** → **Set up a domain**, informe o domínio e siga a configuração apresentada.

- Para domínio raiz (por exemplo, `exemplo.com`), adicione o domínio como uma zona Cloudflare e aponte os nameservers para a Cloudflare.
- Para subdomínio (por exemplo, `www.exemplo.com`), associe-o ao projeto pelo fluxo **Set up a domain**. Se o DNS estiver em outro provedor, crie o CNAME solicitado apontando para `<projeto>.pages.dev`.

Associe o domínio no painel Pages antes de criar manualmente um CNAME; um CNAME isolado pode não ativar o domínio. Consulte a [documentação de domínios customizados do Cloudflare Pages](https://developers.cloudflare.com/pages/configuration/custom-domains/) para requisitos atuais de DNS e ativação.
