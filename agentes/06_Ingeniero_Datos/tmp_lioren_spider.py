import os
import time
from playwright.sync_api import sync_playwright
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../.env'))

EMAIL = os.getenv("LIOREN_EMAIL")
PWD = os.getenv("LIOREN_PASSWORD")

def capturar():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        try:
            page.goto("https://cl.lioren.enterprises/login")
            page.fill("input[name='email']", EMAIL)
            page.fill("input[type='password']", PWD)
            page.click("button[type='submit']")
            page.wait_for_selector("text=SELECCIONAR", timeout=15000)
            page.click("text=SELECCIONAR")
            page.goto("https://cl.lioren.enterprises/empresas/the-boos-box-spa#/recepcion/documentos")
            time.sleep(5)
            
            with open("lioren_dom.html", "w", encoding="utf-8") as f:
                f.write(page.content())
            page.screenshot(path="lioren_screen.png", full_page=True)
            print("Captura terminada exitosamente.")
        except Exception as e:
            print("Error:", e)
        finally:
            browser.close()

if __name__ == "__main__":
    capturar()
