# Template Discovery V4 — CalcMot

## Objetivo
Evitar uma landing genérica criada do zero: pesquisar páginas reais, avaliar padrões e adaptá-los à decisão do motorista. Pesquisa em 24/09/2026, com busca web e inspeção visual no navegador. Galeria consultada: https://www.lapa.ninja/about/. As referências abaixo foram verificadas nos sites de origem; não são templates adquiridos nem prova de conversão medida.

## Referências pesquisadas

### Swipe Mobile App — Framer Marketplace / Framespark — https://www.framer.com/marketplace/templates/swipe-mobile-app/
- Categoria: template de landing page para app mobile e fintech.
- Por que serve para CalcMot: usa o telefone como protagonista, apresenta cartões de informação ao redor do produto e leva o download para a primeira decisão.
- O que NÃO copiar: aparência aqua, nuvens, telefone de iPhone, textos financeiros, badges, depoimentos, pricing, assets ou composição 1:1.
- Padrões úteis extraídos: produto grande no centro, números próximos do contexto, CTA de download repetido com clareza e blocos curtos de benefício.
- Tipo de motion/efeito observado: camadas leves e composição de mockup; nenhum efeito pesado foi adotado.
- Aplicação possível no CalcMot: oferta real da Uber em destaque, quatro sinais ilustrativos com aparência do aviso e CTA azul com ícone vetorial.

### Flighty — https://flighty.com/
- Categoria: app mobile de informação operacional em tempo real.
- Por que serve: produto no telefone, dados de viagem, alertas contextuais e CTA de download; quatro critérios presentes (produto protagonista, métricas, contraste, CTA).
- O que NÃO copiar: avião, passaporte, assets, prêmios, depoimentos, layout ou identidade roxa.
- Padrões úteis: telefone legível; informação contextual junto ao produto; benefício associado ao momento da viagem.
- Motion/efeito observado: composição de telefone sobre fundo profundo e navegação por momentos; DOM identifica seções de parallax. Não foi medida duração de animação e o parallax não será reproduzido.
- Aplicação: oferta → cálculo → motorista decide; dados destacados ao redor do telefone.

### Linear — https://linear.app/
- Categoria: ferramenta operacional/produtividade.
- Por que serve: interface real como demonstração, hierarquia tipográfica, contraste dark e bordas discretas; quatro critérios presentes (produto visível, contraste, narrativa visual, aparência profissional).
- O que NÃO copiar: posicionamento de IA, textos, dashboard, logos, código e identidade.
- Padrões úteis: superfície quase preta, título forte, densidade controlada, demonstração com conteúdo concreto.
- Motion/efeito observado: conteúdo do hero apareceu após carregamento; não atribuímos isso a uma animação específica. Uso proposto restrito a hover CSS de 180ms.
- Aplicação: números e classificação em primeiro plano; separadores finos e sem card em toda frase.

### Revolut Brasil — https://www.revolut.com/pt-BR/
- Categoria: fintech mobile.
- Por que serve: headline de escala grande, CTA direto, contraste e números sobre a apresentação do produto; quatro critérios presentes (métricas, contraste, CTA, narrativa visual).
- O que NÃO copiar: fotografia, valores, promessa financeira, identidade, prova social e composição 1:1.
- Padrões úteis: uma mensagem por dobra; números fáceis de escanear; CTA imediatamente após a promessa.
- Motion/efeito observado: camadas visuais e painel sobre fotografia; captura estática não comprova animação. Nenhum vídeo será adaptado.
- Aplicação: título incisivo, download imediato e métricas grandes; trocar a narrativa bancária pela oferta de corrida.

## Matriz de padrões
| Padrão visual | Referência | Como aplicar | Risco | Decisão |
| --- | --- | --- | --- | --- |
| Produto protagonista | Flighty / Swipe Mobile App | Captura real da oferta UberX e do aviso CalcMot logo no hero | Dados pessoais na tela | Usar arquivo recortado fisicamente, sem endereços |
| Dados contextuais | Flighty | R$ 2,01/km, R$ 47,31/h, 13 min e BOA da própria captura | Repetir números sem relação com a imagem | Quatro sinais compactos abaixo da foto |
| Superfícies dark | Linear | Fundo oficial e bordas sutis | Parecer SaaS de IA | Copy e dados exclusivos de corrida |
| Headline de impacto | Revolut | H1 solicitado e CTA azul | Produto ficar abaixo demais | Split desktop; CTA primeiro mobile |
| Segunda oferta real | Swipe Mobile App / assets CalcMot | Outro cartão UberX e aviso BOA após o hero | Parecer a mesma oferta do hero | Usar `overlay-real-cropped.jpg`, com valores e texto próprios |
| Quatro sinais | Aviso real do CalcMot | Exemplos em HTML de ÓTIMA, BOA, MÉDIA e RUIM | Confundir exemplo com captura real | Rotular como exemplos de sinais |
| Comparação escaneável | Adaptação própria | Duas ofertas e métricas contrastantes | Parecer garantia | Explicitar exemplos e estimativa |

## Direção escolhida
Página de produto para motorista: título direto, oferta real em contexto, quatro sinais ilustrativos, números visíveis e comparação de ofertas. Azul para ação; roxo apenas para ÓTIMA; verde para marca e BOA.

## Regras para implementação
- Preservar componentes, rotas, SSR e configuração de build.
- Hero usa a captura real `offer-uber-live-cropped.jpg` de 720 × 600. Os quatro cartões externos repetem apenas os números dessa oferta; não cobrem a imagem.
- Segunda oferta real em `overlay-real-cropped.jpg` com valores próprios. Ambos os arquivos foram recortados fisicamente antes dos endereços.
- Quatro sinais feitos em HTML/CSS com valores ilustrativos e rótulos atuais do aplicativo. Capturas antigas de testes não entram na página.
- Evitar galeria longa de três telefones; demonstração compacta do overlay.
- Timeline simples, quatro classificações, confiança concisa, FAQ nativa, CTA final.
- Sem bibliotecas novas, vídeos, WebGL, parallax, contadores, prova social ou assets de terceiros.
- Respeitar reduced motion, foco e toque de 48px.
