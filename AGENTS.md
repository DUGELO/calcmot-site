# AGENTS.md — CalcMot Site

## Objetivo

Orientar agentes Codex neste repositório sem interferir na direção criativa, copy ou UX.

Prioridade máxima: preservar o projeto funcionando.

Não transforme tarefas pequenas em refactors grandes.
Não altere arquitetura sem autorização.
Não mexa em SSR sem necessidade explícita.
Não mude copy, design ou produto se a tarefa não pedir.

---

## Stack do projeto

Este projeto usa:

- Angular SSR
- Standalone Components
- TypeScript
- SCSS
- Mobile-first
- Sem backend

Preserve a estrutura existente sempre que possível.

---

## Arquivos sensíveis

Não alterar sem autorização explícita:

- `server.ts`
- `main.server.ts`
- `app.routes.server.ts`
- configuração SSR
- configuração de build
- `angular.json`, salvo se for necessário e explicado

Se precisar mexer nesses arquivos, pare e explique antes.

---

## Política de modelos

Use modelos conforme o custo da tarefa.

### Astra

Usar somente para:

- decisão estratégica;
- arquitetura;
- direção visual;
- revisão final;
- conflito entre agentes;
- aprovação ou reprovação de release.

Não usar Astra para tarefa mecânica.

### Sol

Usar para:

- implementação Angular;
- componentes;
- layout;
- responsividade;
- integração de decisões já aprovadas.

### Terra

Usar para:

- QA;
- revisão de diff;
- acessibilidade;
- SEO técnico;
- validação SSR/build;
- checagem de regressões.

### Luna

Usar para:

- docs simples;
- README;
- checklist;
- typos;
- tarefas pequenas;
- ajustes mecânicos.

Regra:

> Astra decide. Sol implementa. Terra valida. Luna organiza.

---

## Classificação da tarefa

Antes de executar, classifique:

- Tipo A: decisão estratégica → Astra
- Tipo B: implementação → Sol
- Tipo C: QA/revisão → Terra
- Tipo D: tarefa mecânica → Luna

Se a tarefa for ambígua, pergunte antes de agir.

---

## Escopo

Faça somente o que foi pedido.

Não adicionar sem pedido:

- páginas novas;
- bibliotecas novas;
- backend;
- login;
- dashboard;
- analytics;
- redesign completo;
- refactor estrutural;
- alteração de SSR;
- alteração de configuração de build.

---

## Economia de tokens

Não releia arquivos grandes sem necessidade.

Não repetir contexto histórico do projeto.

Não gerar documentação longa quando a tarefa pede código.

Não gerar código quando a tarefa pede análise.

Não usar Astra se Sol, Terra ou Luna resolvem.

---

## Validação

Depois de alteração relevante, rodar:

```bash
npm run qa:static
npm run build