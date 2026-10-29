const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const analysisFixture = require('../tests/fixtures/ride-analysis.json');
const root = path.resolve('dist/calcmot-site/browser');
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'};
const server = createServer(async(req,res)=>{
  try {
    let file=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!file.startsWith(root+path.sep)) throw Error();
    if(!path.extname(file))file=path.join(file,'index.html');
    const data=await readFile(file);res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(data);
  }catch{res.statusCode=404;res.end('Not found');}
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'msedge'});
  try{
    for(const width of [320,390,768,1280]){
      const page=await browser.newPage({viewport:{width,height:900}});
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.addInitScript(()=>{window.sharedData=null;Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.sharedData=data;}});Object.defineProperty(navigator,'canShare',{value:()=>true});});
      await page.goto(`http://127.0.0.1:${server.address().port}/ferramentas/corrida-vale-a-pena/`,{waitUntil:'networkidle'});
      assert.equal(await page.locator('#fare').inputValue(),'');
      if(width===390)await page.screenshot({path:'docs/deploy/ride-start-390.png'});
      await page.locator('#fare').fill('18');
      await page.locator('#tripKm').fill('10');
      await page.locator('#tripMinutes').fill('20');
      await page.getByRole('button',{name:'Calcular minha corrida',exact:true}).click();
      await page.locator('.ride-ai-toggle>summary').click();
      await page.locator('#ride-context').waitFor();
      assert.equal(await page.locator('.calculator__metric').count(),4);
      assert.equal(await page.locator('.calculator__instagram svg').count(),1);
      await page.getByRole('button',{name:'Analisar com CalcMot',exact:true}).click();
      await page.getByRole('alert').waitFor();
      assert.equal(await page.locator('#ride-context').evaluate(el=>el===document.activeElement),true);
      await page.getByRole('button',{name:'+ Volta vazia',exact:true}).click();
      await page.waitForFunction(()=>document.getElementById('ride-context').value.length>0);
      const idea=await page.locator('#ride-context').inputValue();
      await page.getByRole('button',{name:'+ Volta vazia',exact:true}).click();
      assert.equal(await page.locator('#ride-context').inputValue(),idea,'Atalho não duplica contexto');
      await page.locator('.ride-goal summary').click();
      await page.locator('#analysis-goal').selectOption('hourly');
      await page.locator('#ride-context').fill('Talvez precise voltar 8 km vazio.');
      let payload;
      let requests=0;
      await page.route('**/api/tools/ride-insights',route=>{requests++;payload=route.request().postDataJSON();return route.fulfill({json:analysisFixture});});
      await page.getByRole('button',{name:'Analisar com CalcMot',exact:true}).click();
      await page.locator('.calculator__analysis').waitFor();
      assert.equal(await page.locator('.calculator__verdict').innerText(),'Ainda falta informação para decidir');
      assert.equal(payload.goal,'hourly');
      assert.equal(await page.getByRole('button',{name:'Análise pronta',exact:true}).isDisabled(),true);
      assert.equal(requests,1);
      await page.locator('.calculator__analysis summary').click();
      assert.equal(await page.locator('.calculator__analysis h5').first().isVisible(),true);
      assert.equal(await page.locator('.calculator__analysis h5').count(),5);
      assert.ok((await page.locator('.calculator__analysis').innerText()).includes('Isso depende de confirmação'));
      assert.equal(payload.context,'Talvez precise voltar 8 km vazio.');
      await page.getByRole('button',{name:'Compartilhar resultado',exact:true}).click();
      const shared=await page.evaluate(()=>window.sharedData);
      assert.ok(shared.text.includes('1,80'));assert.ok(!shared.text.includes('vazio'));
      await page.evaluate(()=>{Object.defineProperty(navigator,'share',{value:undefined,configurable:true});Object.defineProperty(navigator,'clipboard',{value:{writeText:async value=>{window.copiedText=value;}},configurable:true});});
      await page.getByRole('button',{name:'Compartilhar resultado',exact:true}).click();
      assert.ok((await page.evaluate(()=>window.copiedText)).includes('1,80'));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      if(width===390){await page.locator('.calculator__analysis summary').click();await page.screenshot({path:'docs/deploy/ride-mobile-390.png',fullPage:true});await page.locator('.calculator__insights').screenshot({path:'docs/deploy/ride-analysis-390.png',style:'.site-header,.skip-link{visibility:hidden!important}'});}
      await page.locator('#ride-context').fill('Um contexto novo para analisar.');
      await page.locator('.calculator__analysis').waitFor({state:'detached'});
      assert.equal(await page.locator('.calculator__analysis').count(),0);
      await page.unroute('**/api/tools/ride-insights');
      await page.route('**/api/tools/ride-insights',route=>route.fulfill({status:503,json:{error:'Análise indisponível no momento.'}}));
      await page.getByRole('button',{name:'Analisar com CalcMot',exact:true}).click();
      await page.getByRole('alert').waitFor();
      assert.equal(await page.locator('.calculator__metric').count(),4);
      await page.unroute('**/api/tools/ride-insights');
      let finishRequest;
      await page.route('**/api/tools/ride-insights',async route=>{
        await new Promise(resolve=>{finishRequest=resolve;});
        await route.fulfill({json:analysisFixture}).catch(()=>{});
      });
      await page.getByRole('button',{name:'Analisar com CalcMot',exact:true}).click();
      await page.locator('.ride-loading').waitFor();
      assert.equal(await page.locator('.ride-spinner').evaluate(el=>getComputedStyle(el).animationName),'ride-spin');
      await page.emulateMedia({reducedMotion:'reduce'});
      assert.equal(await page.locator('.ride-spinner').evaluate(el=>getComputedStyle(el).animationName),'none');
      await page.getByRole('button',{name:'Cancelar análise',exact:true}).click();
      await page.locator('.ride-loading').waitFor({state:'detached'});
      finishRequest();
      await page.emulateMedia({reducedMotion:'no-preference'});
      assert.equal(await page.locator('.calculator__metric').count(),4,'Cancelar IA preserva cálculo');
      assert.equal(await page.locator('.calculator__analysis').count(),0,'Resposta cancelada não deve reaparecer');
      await page.getByRole('button',{name:'Usar exemplo',exact:true}).click();
      await page.locator('#costPerKm').fill('2');
      await page.getByRole('button',{name:'Calcular minha corrida',exact:true}).click();
      assert.ok((await page.locator('.calculator__balance').innerText()).includes('-R$'));
      await page.getByRole('button',{name:'Limpar',exact:true}).click();
      await page.locator('.calculator__metric').first().waitFor({state:'detached'});
      assert.equal(await page.locator('.calculator__metric').count(),0);
      assert.deepEqual(errors,[]);
      console.log(`UI OK ${width}px: cálculo, contexto, IA mock, erro, Instagram, share nativo/clipboard, reset, overflow e JS.`);
      await page.close();
    }
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
