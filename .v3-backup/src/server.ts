import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'text/javascript; charset=UTF-8');
      }
    },
  }),
);

// Never let SSR turn a missing bundle into an HTML response. Browsers then
// report the real missing asset instead of a misleading module MIME error.
app.use((req, res, next) => {
  const isAssetRequest = /\.(?:js|mjs|css|map|json|woff2?|ttf|otf|png|jpe?g|svg|webp|avif|ico)$/.test(
    req.path,
  );

  if ((req.method === 'GET' || req.method === 'HEAD') && isAssetRequest) {
    res.status(404).type('text/plain').send(`Asset not found: ${req.path}`);
    return;
  }

  next();
});

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`CalcMot SSR em http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
