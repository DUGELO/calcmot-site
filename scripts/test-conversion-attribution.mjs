import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';

const source = readFileSync('src/app/core/analytics/conversion-attribution.ts', 'utf8');
const js = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports = {};
vm.runInNewContext(js, {exports, URL, Set, JSON});
const {canonicalPath,pageGroup,trackedDestination,safePlacement,entryFromReferrer,storedCalculatorEntry} = exports;
assert.equal(canonicalPath('/ferramentas/corrida-vale-a-pena///'), '/ferramentas/corrida-vale-a-pena');
assert.equal(pageGroup('/ferramentas/corrida-vale-a-pena/'), 'ride_calculator');
assert.equal(pageGroup('/'), 'home');
assert.equal(pageGroup('/calculadora-ganhos-motorista-app/'), 'app_calculator');
assert.equal(safePlacement('header_mobile'), 'header_mobile');
assert.equal(safePlacement('how_it_works_play'), 'how_it_works_play');
assert.equal(safePlacement('PII/?abc'), 'other_link');
assert.equal(trackedDestination('/ferramentas/corrida-vale-a-pena/', 'https://calcmot.com.br/'), 'ride_calculator');
assert.equal(trackedDestination('https://play.google.com/store/apps/details?id=br.com.calcmot', 'https://calcmot.com.br/'), 'play_store');
assert.equal(trackedDestination('https://play.google.com/store/apps/details?id=com.outro', 'https://calcmot.com.br/'), null);
assert.equal(trackedDestination('https://site-falso.com/ferramentas/corrida-vale-a-pena/', 'https://calcmot.com.br/'), null);
assert.equal(entryFromReferrer('https://calcmot.com.br/como-funciona/?abc=private','https://calcmot.com.br/ferramentas/corrida-vale-a-pena/').sourcePage,'how_it_works');
assert.equal(entryFromReferrer('https://instagram.com/x?session=secret','https://calcmot.com.br/ferramentas/corrida-vale-a-pena/').sourcePage,'external');
assert.equal(entryFromReferrer('','https://calcmot.com.br/ferramentas/corrida-vale-a-pena/').entryType,'direct');
const now = 1000000;
assert.equal(storedCalculatorEntry(JSON.stringify({sourcePage:'home',placement:'home_hero',timestamp:now-1000}),now).sourcePage,'home');
assert.equal(storedCalculatorEntry(JSON.stringify({sourcePage:'home',placement:'home_hero',timestamp:now-121000}),now),null);
assert.equal(storedCalculatorEntry(JSON.stringify({sourcePage:'https://example.com/?secret=1',placement:'home_hero',timestamp:now}),now),null);

const analytics = readFileSync('src/app/core/services/site-analytics.service.ts', 'utf8');
const beforeConfig = analytics.indexOf("browser.gtag('config', ANALYTICS_CONFIG.googleMeasurementId)");
const afterView = analytics.indexOf("this.trackCalculatorView(browser)");
assert.ok(beforeConfig >= 0 && afterView > beforeConfig, 'GA4 deve inicializar antes do evento de visita');
assert.ok(!analytics.includes("'web_play_clicked'"), 'Evitar evento legado duplicado de Play Store');
assert.equal((analytics.match(/this\.document\.addEventListener\('click'/g) || []).length, 1, 'Um único listener de cliques');

console.log('Conversões: caminhos canônicos, origens categóricas, destinos, expiração e privacidade OK.');
