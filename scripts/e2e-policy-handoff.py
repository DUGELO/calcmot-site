"""Real Angular Router regression, synthetic auth only. Never run against production."""
import os
import subprocess
import time
import urllib.request
from playwright.sync_api import sync_playwright, expect

port = 4312
base = f"http://127.0.0.1:{port}/admin?scenario=policy-handoff"
env = {**os.environ, "ADMIN_TEST_PORT": str(port)}
process = subprocess.Popen(["node", "scripts/serve-admin-prototype.mjs"], env=env)
try:
    for attempt in range(120):
        if process.poll() is not None:
            raise RuntimeError("Synthetic harness exited before readiness")
        try:
            with urllib.request.urlopen(base, timeout=1) as response:
                if response.status == 200:
                    break
        except OSError:
            time.sleep(1)
    else:
        raise RuntimeError("Synthetic harness unavailable")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        private_requests = []
        page.on("request", lambda request: private_requests.append(request.url)
                if "127.0.0.1:8971" in request.url else None)
        panel = page.get_by_role("heading", name="Registrar a política aprovada", exact=True)
        login = page.get_by_role("button", name="Continuar com Google", exact=True)

        # Initial URL capture survives login through the actual lazy-loaded Router.
        page.goto(base + "#policy-bootstrap=8971." + "a" * 64)
        expect(login).to_be_visible()
        expect(page).to_have_url(base)
        login.click()
        expect(panel).to_be_visible()
        page.get_by_role("button", name="Voltar ao painel", exact=True).click()
        expect(panel).to_have_count(0)

        # A link opened in the already authenticated tab must not require a second login.
        page.goto(base)
        login.click()
        page.get_by_role("heading", name="Visão geral", exact=True).wait_for()
        page.get_by_role("link", name="Abrir handoff sintético nesta aba", exact=True).click()
        expect(panel).to_be_visible()
        expect(page).to_have_url(base)
        page.get_by_role("button", name="Voltar ao painel", exact=True).click()
        page.get_by_role("link", name="Abrir handoff sintético nesta aba", exact=True).click()
        expect(panel).to_have_count(0)  # Repeated fragment never resurrects a cancelled intent.
        expect(page).to_have_url(base)

        # RouterLink uses pushState, which does not dispatch native hashchange.
        page.get_by_role("link", name="Abrir handoff pelo Router", exact=True).click()
        expect(panel).to_be_visible()
        expect(page).to_have_url(base)
        assert private_requests == [], "Opening a handoff must never contact the receiver automatically"
        browser.close()
    print("Policy handoff Router E2E passed: initial login, authenticated hashchange, RouterLink, cleanup; no receiver or token.")
finally:
    process.terminate()
    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=5)
