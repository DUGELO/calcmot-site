#!/usr/bin/env python3
"""Integração de analytics no build Angular: host de produção simulado, sem envio real ao GA4.

Reutiliza os arquivos publicados pelo Angular. O Chromium navega no hostname
calcmot.com.br, mas os recursos são servidos por um servidor local; os scripts de
Google/Clarity são interceptados, preservando a fila de eventos gerada por gtag.
"""
from __future__ import annotations

import json
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parent.parent / "dist" / "calcmot-site" / "browser"
assert (ROOT / "ferramentas" / "corrida-vale-a-pena" / "index.html").is_file(), "Build de produção ausente"

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args: object) -> None:
        pass

server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
LOCAL = f"http://127.0.0.1:{server.server_port}"
ORIGIN = "https://calcmot.com.br"


def events(page, name: str) -> list[dict]:
    return page.evaluate("""name => (window.dataLayer || [])
       .filter(item => item[0] === 'event' && item[1] === name)
       .map(item => item[2] || {})""", name)


def setup(page) -> None:
    def serve(route):
        url = route.request.url
        if url.startswith(ORIGIN + "/"):
            response = route.fetch(url=LOCAL + url[len(ORIGIN):])
            route.fulfill(response=response)
        elif (url.startswith("https://www.googletagmanager.com/")
              or url.startswith("https://www.clarity.ms/")):
            route.fulfill(status=200, content_type="text/javascript", body="")
        else:
            route.abort()
    page.route("**/*", serve)


try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 390, "height": 844})
        page = context.new_page()
        errors: list[str] = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        setup(page)

        # Primeiro acesso: visita direta deve gerar um único evento, com origem direta.
        page.goto(ORIGIN + "/ferramentas/corrida-vale-a-pena/", wait_until="networkidle")
        expect(page.locator("app-root h1")).to_contain_text("Essa corrida vale a pena?")
        viewed = events(page, "web_calculator_viewed")
        assert len(viewed) == 1, f"Visualização direta: esperado 1, encontrado {viewed}"
        assert viewed[0]["source_page"] == "direct", viewed
        assert viewed[0]["entry_type"] == "direct", viewed
        assert all(name not in json.dumps(viewed) for name in ("fare", "pickupKm", "tripKm"))

        # Link legítimo da Play Store: exatamente um evento novo por clique e
        # nenhum disparo do nome legado removido (não navegar até a loja).
        link = page.locator("a[data-analytics-placement='calculator_real_offer']")
        expect(link).to_have_count(1)
        link.evaluate("a => a.addEventListener('click', e => e.preventDefault())")
        link.click()
        play = events(page, "web_play_store_clicked")
        assert len(play) == 1, f"Clique Play Store: esperado 1, encontrado {play}"
        assert play[0]["source_page"] == "ride_calculator", play
        assert play[0]["link_placement"] == "calculator_real_offer", play
        assert len(events(page, "web_play_clicked")) == 0, "Evento legado duplicado"
        print("OK: domínio de produção simulado, visita direta + clique Play Store único")

        # Entrada originada na home: a ponte de navegação deve transportar apenas
        # categorias, sem referrer bruto nem dados financeiros.
        page.goto(ORIGIN + "/", wait_until="networkidle")
        home_link = page.locator("a[data-analytics-placement='home_hero']")
        expect(home_link).to_have_count(1)
        home_link.click()
        expect(page.locator("app-root h1")).to_contain_text("Essa corrida vale a pena?")
        viewed = events(page, "web_calculator_viewed")
        assert len(viewed) == 1, f"Entrada home: esperado 1, encontrado {viewed}"
        assert viewed[0]["source_page"] == "home", viewed
        assert viewed[0]["link_placement"] == "home_hero", viewed
        assert viewed[0]["entry_type"] == "internal", viewed
        assert len(events(page, "page_view")) == 0, "page_view manual indevido"
        assert not errors, f"Erros JavaScript: {errors}"
        print("OK: origem home e CTA identificados, sem duplicações ou dados sensíveis")
        browser.close()
finally:
    server.shutdown()
