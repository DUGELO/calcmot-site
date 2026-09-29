# CalcMot — Site oficial Angular SSR

Landing page institucional do CalcMot em Angular, SSR, Standalone Components e SCSS.

## Requisitos

- Node.js 22.12+ para Angular 21 (o projeto foi pensado para Angular 21.2 LTS)
- npm 10+

## Criar do zero com Angular CLI

```powershell
cd C:\Users\426174\Documents\code
npx @angular/cli@21 new calcmot-site --ssr --standalone --style=scss --routing --strict --skip-git
cd .\calcmot-site
```

Se a pasta já existir, copie o conteúdo deste projeto para ela e execute:

```powershell
cd C:\Users\426174\Documents\code\calcmot-site
npm install
npm run qa:static
npm start
```

A aplicação de desenvolvimento ficará, por padrão, em `http://localhost:4200`.

## Build SSR

```powershell
npm run build
npm run serve:ssr
```

O servidor Node do build fica, por padrão, em `http://localhost:4000`.

## Verificação de SSR

Com o servidor SSR em execução:

```powershell
Invoke-WebRequest http://localhost:4000/ | Select-Object -ExpandProperty Content
```

Procure no HTML retornado por:

```text
Pare de aceitar corrida no escuro.
```

Se o texto vier no HTML da resposta, o conteúdo principal está sendo renderizado no servidor.

## Play Store

URL oficial usada no projeto:

`https://play.google.com/store/apps/details?id=br.com.calcmot`

A URL está centralizada em `src/app/core/constants/brand.tokens.ts`.

## QA automatizado no Windows

O projeto inclui `scripts/verify-ssr.ps1`, já apontando para:

`C:\Users\426174\Documents\code\calcmot-site`

Execute no PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\verify-ssr.ps1
```

O script instala dependências, executa o QA estático, roda `ng build`, inicia o servidor SSR e confirma que a headline principal existe no HTML inicial.
