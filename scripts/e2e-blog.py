"""Real Angular/Chromium checks with temporary articles; no external analytics."""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
base = sys.argv[1]
output = Path(sys.argv[2])
errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for width in (320, 390, 768, 1024, 1440):
        page = browser.new_page(viewport={"width": width, "height": 900})
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(base + "/blog/", wait_until="networkidle")
        expect(page.locator("app-root h1")).to_have_text("Blog CalcMot")
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"Overflow blog {width}"
        if width in (390, 1440):
            page.screenshot(path=str(output / f"blog-index-{width}.png"), full_page=True)
        page.locator(".blog-card h2 a").first.click()
        page.wait_for_url("**/blog/qa-artigo-*/")
        expect(page.locator(".blog-prose")).to_contain_text("CALCMOT_QA_BODY")
        expect(page.locator("h1")).to_have_count(1)
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"Overflow article {width}"
        assert page.locator(".blog-cover").evaluate("image => image.complete && image.naturalWidth > 0")
        expect(page.locator("[data-analytics-placement='blog_tool']")).to_be_visible()
        if width in (390, 1440):
            page.screenshot(path=str(output / f"blog-article-{width}.png"), full_page=True)
        page.locator(".blog-breadcrumb a[href='/blog/']").click()
        page.wait_for_url("**/blog/")
        page.locator(".blog-pagination a[rel='next']").click()
        page.wait_for_url("**/blog/pagina/2/")
        expect(page.locator("app-root h1")).to_contain_text("Página 2")
        page.locator(".blog-categories a").nth(1).click()
        page.wait_for_url("**/blog/categoria/lucro-por-quilometro/")
        expect(page.locator("app-root h1")).to_have_text("Lucro por quilômetro")
        page.close()
    # A crawler without JS receives the body, links and metadata too.
    page = browser.new_page(java_script_enabled=False)
    page.goto(base + "/blog/qa-artigo-1/")
    expect(page.locator(".blog-prose")).to_contain_text("Fim integral do artigo 1.")
    expect(page.locator("h1")).to_have_count(1)
    browser.close()
assert not errors, errors
print("Blog Chromium: mobile/desktop, imagens, categorias, paginação, navegação e HTML sem JS OK.")
