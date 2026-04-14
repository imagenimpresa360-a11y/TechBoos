import os, time, sys, io
from playwright.sync_api import sync_playwright
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../.env'))
EMAIL = os.getenv("LIOREN_EMAIL")
PWD = os.getenv("LIOREN_PASSWORD")

def descubrir():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, args=['--start-maximized'])
        context = browser.new_context(no_viewport=True)
        page = context.new_page()
        
        print("1. Entrando...")
        page.goto("https://cl.lioren.enterprises/login")
        page.fill('input[name="email"]', EMAIL)
        page.fill('input[type="password"]', PWD)
        page.click('button[type="submit"]')
        
        print("2. Empresa...")
        page.wait_for_selector("text=SELECCIONAR", timeout=20000)
        page.locator("text=SELECCIONAR").nth(1).click()
        time.sleep(10)
        
        print("3. Escaneando Recepcion...")
        page.goto("https://cl.lioren.enterprises/empresas/the-boos-box-spa#/recepcion", wait_until="commit")
        time.sleep(10)
        
        # Extraer TODOS los botones con sus propiedades
        btns = page.evaluate('''() => {
            return [...document.querySelectorAll("button, a, md-icon, i, span")].map(e => ({
                tag: e.tagName,
                label: e.getAttribute("aria-label"),
                inner: e.innerText,
                classes: e.className,
                id: e.id
            })).filter(b => b.label || (b.classes && b.classes.includes('fa-')) || (b.inner && b.inner.length < 20));
        }''')
        
        print("\n--- SOSPECHOSOS DE DESCARGA DETECTADOS ---")
        for b in btns:
            # Buscamos palabras clave en label, inner o classes
            identidad = f"{b['label']} {b['inner']} {b['classes']}".lower()
            if any(k in identidad for k in ['excel', 'export', 'descarg', 'download', 'file', 'table']):
                print(f"FOUND: {b}")
            
        browser.close()

if __name__ == "__main__":
    descubrir()
