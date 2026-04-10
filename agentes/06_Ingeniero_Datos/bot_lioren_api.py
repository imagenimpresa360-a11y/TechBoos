import os
import json
import time
from playwright.sync_api import sync_playwright
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../.env'))

EMAIL = os.getenv("LIOREN_EMAIL")
PWD = os.getenv("LIOREN_PASSWORD")

def interceptar_y_descargar():
    print("--- INICIANDO PROTOCOLO AUTOMÁTICO (API/COOKIE HIJACKING) ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False) # Mostramos unos segundos
        context = browser.new_context()
        page = context.new_page()
        
        # Interceptar todas las peticiones para capturar API o Tokens
        api_headers = {}
        
        def handle_request(route, request):
            nonlocal api_headers
            if "/api/" in request.url or "graphql" in request.url:
                api_headers = request.headers
            route.continue_()

        page.route("**/*", handle_request)
        
        try:
            print("1. Accediendo a Lioren...")
            page.goto("https://cl.lioren.enterprises/login")
            page.fill("input[name='email']", EMAIL)
            page.fill("input[type='password']", PWD)
            page.click("button[type='submit']")
            page.wait_for_selector("text=SELECCIONAR", timeout=15000)
            page.click("text=SELECCIONAR")
            page.goto("https://cl.lioren.enterprises/empresas/the-boos-box-spa#/recepcion/documentos")
            
            print("2. Esperando interceptar credenciales de red internas (5 segs)...")
            time.sleep(5)
            
            cookies = context.cookies()
            print("[+] Cookies de sesion capturadas exitosamente.")
            # Guardamos las cookies para uso de Requests
            with open("lioren_session.json", "w") as f:
                json.dump({'cookies': cookies, 'headers': api_headers}, f)
                
            print("[+] Mision del Bot de Red completada. Cerrando navegador.")
        except Exception as e:
            print("[!] Error en protocolo:", e)
        finally:
            browser.close()

if __name__ == "__main__":
    interceptar_y_descargar()
