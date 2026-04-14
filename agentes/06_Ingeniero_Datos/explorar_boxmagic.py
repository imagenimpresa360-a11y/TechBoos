from playwright.sync_api import sync_playwright

def explorar_urls():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto('https://boxmagic.cl')
        print(f"URL HOME: {page.url}")
        
        try:
            admin_btn = page.get_by_text('Acceso Administrador').first
            href = admin_btn.get_attribute("href")
            print(f"URL BOTON ADMIN: {href}")
        except Exception as e:
            print(f"No se encontro boton: {e}")
            
        browser.close()

if __name__ == "__main__":
    explorar_urls()
