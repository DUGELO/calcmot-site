#!/usr/bin/env python3
"""Real Angular UI, synthetic PDFs, stubbed security/provider boundary. Not Gemini homologation."""
import json, threading, os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parent.parent/'dist/calcmot-site/browser'
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
REPORT=dict(platform='Uber',documentType='earnings_statement',periodStart='2026-01-01',periodEnd='2026-01-31',grossPassengerCents=1601,grossTotalCents=1601,platformFeeCents=401,driverPayoutCents=1200,tipsCents=0,incentivesCents=0,reimbursementsCents=0,kilometers=4,evidence={})
FAKE_SECURITY="""window.turnstile={render:(element,options)=>{window.testSecurity=options;options.callback('synthetic-token-not-real');return 'synthetic-widget';},reset:()=>window.testSecurity.callback('fresh-synthetic-token'),remove:()=>{}};"""
errors=[];completed=0
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,**({'executable_path':os.environ['PLAYWRIGHT_CHROMIUM_EXECUTABLE'],'args':['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--single-process','--in-process-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']} if os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') else {}))
  context=browser.new_context(accept_downloads=True)
  for width in (320,390,1280):
   page=context.new_page();page.set_viewport_size({'width':width,'height':900})
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.route('https://challenges.cloudflare.com/**',lambda route:route.fulfill(content_type='application/javascript',body=FAKE_SECURITY))
   page.route('**/auditor-interno/config',lambda route:route.fulfill(json={'enabled':True,'siteKey':'0x00000000000000000000'}))
   replies=[];calls=[];deferred=[]
   def analyse(route):
    calls.append(route.request.post_data_buffer)
    payload=replies.pop(0) if replies else {'report':REPORT,'issues':[],'status':'ready'}
    if payload.pop('_hold',False):deferred.append(route);return
    route.fulfill(status=payload.pop('_http',200),json=payload)
   page.route('**/auditor-interno/analisar',analyse)
   page.goto(base+'/ferramentas/auditor-ganhos-ir/',wait_until='networkidle')
   expect(page.get_by_role('heading',level=1)).to_have_text('Auditor de ganhos e IR facilitado')
   field=page.locator('#auditor-files')
   expect(field).to_be_disabled()
   expect(page.locator('section.auditor')).to_have_attribute('data-clarity-mask','true')
   page.locator('.auditor__check input').first.check()
   expect(field).to_be_enabled()
   def upload(tag='one',mime='application/pdf',body=None):
    field.set_input_files({'name':f'{tag}.pdf','mimeType':mime,'buffer':body or ('%PDF-1.7\nsynthetic document '+tag+'\n%%EOF').encode()})
   upload()
   expect(page.locator('.auditor__item')).to_have_count(1)
   expect(page.locator('#financial-title').locator('..')).to_contain_text('12,00')
   assert len(calls)==1 and b'demonstrativo.pdf' in calls[0] and b'one.pdf' not in calls[0]
   # Identical PDF cannot be added again, and a fresh token is available for the next document.
   upload();expect(page.get_by_role('alert')).to_contain_text('já está na sessão');assert len(calls)==1
   # Partial extraction is review-only; a one-cent mismatch cannot be manually confirmed.
   replies.append({'report':{**REPORT,'driverPayoutCents':1201},'issues':['RECONCILIACAO_PENDENTE'],'status':'review'})
   upload('review');expect(page.locator('.auditor__item')).to_have_count(2)
   page.get_by_role('button',name='Confirmar após conferir PDF').click()
   expect(page.get_by_role('alert')).to_contain_text('reconciliar exatamente')
   page.locator('.auditor__item').nth(1).get_by_role('button',name='Excluir documento').click()
   # Correct annual summary wins over an overlapping monthly file.
   annual={**REPORT,'documentType':'annual_earnings_statement','periodStart':'2026-01-01','periodEnd':'2026-12-31','grossPassengerCents':10000,'grossTotalCents':10000,'platformFeeCents':1000,'driverPayoutCents':9000}
   replies.append({'report':annual,'issues':[],'status':'ready'})
   upload('annual');expect(page.locator('.auditor__item')).to_have_count(2)
   expect(page.locator('#financial-title').locator('..')).to_contain_text('1 documento(s)')
   with page.expect_download() as download:
    page.get_by_role('button',name='Exportar CSV dos valores conferidos').click()
   csv=Path(download.value.path()).read_text(encoding='utf-8-sig')
   assert len(csv.splitlines())==2 and '90,00' in csv and 'ANNUAL_PRIORITY_V2' in csv
   # Fiscal only for the selected year, no DARF or tax-due output.
   page.get_by_label('Enquadramento',exact=True).select_option('pf')
   page.get_by_label('Ano-calendário',exact=True).select_option('2026')
   checks=page.locator('#tax-title').locator('..').locator('input[type=checkbox]')
   for check in checks.all():check.check()
   expect(page.locator('#tax-title').locator('..')).to_contain_text('60,00')
   evidence=ROOT.parents[2]/'.angular/auditor-e2e'
   evidence.mkdir(parents=True,exist_ok=True)
   page.screenshot(path=str(evidence/f'auditor-{width}px.png'),full_page=True)
   # Erasure and quota error are comprehensible; no fake report from a failure.
   page.get_by_role('button',name='Apagar dados da sessão',exact=True).click()
   expect(page.locator('.auditor__item')).to_have_count(0)
   replies.append({'code':'PROVIDER_QUOTA','_http':503});upload('quota')
   expect(page.get_by_role('alert')).to_contain_text('Limite da IA')
   expect(page.locator('.auditor__item')).to_have_count(0)
   replies.append({'_hold':True});upload('cancel')
   expect(page.get_by_role('button',name='Cancelar e apagar dados da sessão')).to_be_visible()
   page.get_by_role('button',name='Cancelar e apagar dados da sessão').click()
   deferred.pop().fulfill(json={'report':REPORT,'issues':[],'status':'ready'})
   expect(page.locator('#auditor-files')).to_be_enabled()
   expect(page.locator('.auditor__item')).to_have_count(0)
   upload('invalid',body=b'not a valid pdf file')
   expect(page.get_by_role('alert')).to_contain_text('assinatura PDF')
   # Labelled controls and keyboard access; layout on phones and desktop.
   assert page.locator('input:not([aria-label]):not([id]):not([type=checkbox])').count()==0
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'overflow at {width}px'
   page.keyboard.press('Tab')
   assert page.evaluate('document.activeElement!==document.body')
   print(f'PASS auditor UI {width}px: upload, dedup, review, annual, CSV, year, erase, quota, invalid PDF, labels, keyboard, layout')
   completed+=1;page.close()
  # Missing remote configuration must keep upload unavailable.
  page=context.new_page();page.route('**/auditor-interno/config',lambda r:r.fulfill(json={'enabled':False,'siteKey':''}))
  page.goto(base+'/ferramentas/auditor-ganhos-ir/',wait_until='networkidle');page.locator('.auditor__check input').first.check()
  expect(page.locator('#auditor-files')).to_be_disabled();page.close();completed+=1
  browser.close()
 assert not errors,errors
 print(f'Auditor E2E: {completed} scenarios PASS; 0 JS errors. Provider and Turnstile stubbed, no personal PDFs.')
finally: server.shutdown()
