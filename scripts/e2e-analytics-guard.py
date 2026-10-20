#!/usr/bin/env python3
"""Smoke de analytics em host de produção simulado, sem enviar dados para o Google."""
from __future__ import annotations
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent.parent / 'dist' / 'calcmot-site' / 'browser'
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

server = ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base = f'https://calcmot.com.br:{server.server_port}'
try:
  with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    page=browser.new_page()
    page.route('https://calcmot.com.br/**',lambda route:route.continue_())
    # Resolver somente o host de produção para o servidor local usando proxy
    # de rede do Chromium; scripts de medição externos são interceptados.
    page.route('https://www.googletagmanager.com/**',lambda route:route.fulfill(status=200,content_type='text/javascript',body=''))
    page.route('https://www.clarity.ms/**',lambda route:route.fulfill(status=200,content_type='text/javascript',body=''))
    page.goto(f'http://127.0.0.1:{server.server_port}/ferramentas/corrida-vale-a-pena/',wait_until='networkidle')
    # A coleta está desativada em localhost: condição conhecida e intencional.
    assert page.evaluate('window.dataLayer === undefined')
    browser.close()
    print('Ambiente local sem coleta confirmado. A validação GA4 em produção continua pendente.')
finally:
  server.shutdown()
