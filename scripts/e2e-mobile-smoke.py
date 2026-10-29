#!/usr/bin/env python3
"""Smoke test mobile-first contra o build Angular real, em Chromium, sem analytics externo."""
from __future__ import annotations

import re
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parent.parent / "dist" / "calcmot-site" / "browser"
assert (ROOT / "ferramentas" / "corrida-vale-a-pena" / "index.html").is_file()

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args: object) -> None:
        pass

server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f"http://127.0.0.1:{server.server_port}"
errors: list[str] = []

try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        for width in (320, 390, 768, 1024):
            page = browser.new_page(viewport={"width": width, "height": 844})
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(f"{base}/ferramentas/corrida-vale-a-pena/", wait_until="networkidle")
            expect(page.locator("app-root h1")).to_contain_text("Essa corrida vale a pena?")
            expect(page.locator(".calculator__metric")).to_have_count(0)
            expect(page.locator("#fare")).to_have_value("")
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (
                f"Overflow horizontal detectado em {width}px"
            )
            if width < 960:
                page.locator(".site-header__mobile-menu summary").click()
                expect(page.locator(
                    ".site-header__mobile-menu a[href='/ferramentas/corrida-vale-a-pena/']"
                )).to_be_visible()
                page.locator(".site-header__mobile-menu summary").click()
            else:
                expect(page.locator(
                    ".site-header__nav a[href='/ferramentas/corrida-vale-a-pena/']"
                )).to_be_visible()

            # A primeira ação realmente usa o motor Angular, sem exibir resultado prévio.
            page.locator("#fare").fill("18")
            page.locator("#tripKm").fill("10")
            page.locator("#tripMinutes").fill("20")
            page.get_by_role("button", name="Calcular minha corrida").click()
            expect(page.locator(".calculator__metric")).to_have_count(4)
            expect(page.locator(".calculator__metric").first).to_contain_text("1,80")

            # Valor inválido: erro somente após tentativa de cálculo.
            page.locator("#fare").fill("0")
            page.get_by_role("button", name="Calcular minha corrida").click()
            expect(page.locator("#fare")).to_have_attribute("aria-invalid", "true")

            # O exemplo completo inclui busca, abre os opcionais e recalcula.
            page.get_by_role("button", name="Usar exemplo", exact=True).click()
            expect(page.locator(".calculator__extras")).to_have_attribute("open", "")
            page.get_by_role("button", name="Calcular minha corrida").click()
            expect(page.locator(".calculator__metric").first).to_contain_text("1,50")

            # Limpar não pode preservar resultado nem valor anterior.
            page.get_by_role("button", name="Limpar", exact=True).click()
            expect(page.locator("#fare")).to_have_value("")
            expect(page.locator(".calculator__metric")).to_have_count(0)
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")

            # Instrumentação somente em produção: links têm posição, não criam popups.
            expect(page.locator(
                ".site-header__cta a[data-analytics-placement='header_cta']"
            )).to_have_attribute("href", re.compile(r"^https://play.google.com/store/apps/details"))
            print(f"OK: {width}px, menu, formulário, resultado, validação, exemplo e reset")
            page.close()
        browser.close()

    assert not errors, f"Erros JS inesperados: {errors}"
    print("Smoke mobile-first Angular OK: quatro larguras, fluxo interativo e sem regressão.")
finally:
    server.shutdown()
