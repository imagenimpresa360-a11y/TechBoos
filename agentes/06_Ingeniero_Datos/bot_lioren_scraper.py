import os
import time
import re
from playwright.sync_api import sync_playwright
from dotenv import load_dotenv
from procesar_facturas_lioren import procesar_archivo_excel

# Cargar variables de entorno desde la raíz del proyecto
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../.env'))

LIOREN_URL = "https://cl.lioren.enterprises/login"
EMAIL = os.getenv("LIOREN_EMAIL")
PWD = os.getenv("LIOREN_PASSWORD")

def descargar_compras_lioren(mes_desde, mes_hasta):
    # Definimos como destino final la carpeta lioren/2026
    download_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lioren', '2026')
    os.makedirs(download_dir, exist_ok=True)

    with sync_playwright() as p:
        print("Iniciando Bot de Extraccion Lioren (Version Mejorada y Segura)...")
        # headless=True significa que correrá 100% invisible de fondo, sin mostrar ventanas,
        # consumiendo mucho menos recurso y mejorando su solidez.
        # browser = p.chromium.launch(headless=False, slow_mo=50) # Cambiado a headless=True para produccion si el server lo permite, pero mejor False para que el user vea
        browser = p.chromium.launch(headless=False, args=['--start-maximized'])
        context = browser.new_context(accept_downloads=True, viewport={'width': 1920, 'height': 1080})
        page = context.new_page()

        try:
            print("1. Accediendo al portal Lioren...")
            page.goto(LIOREN_URL)
            page.fill("input[name='email']", EMAIL)
            page.fill("input[type='password']", PWD)
            page.click("button[type='submit']")
            
            # SOLUCIÓN SUPERVISADA: En lugar de 'networkidle', esperamos estrictamente a que aparezca 
            # en código fuente el botón 'SELECCIONAR', esto evita cuelgues.
            print("2. Esperando renderizacion de la pantalla de Seleccion de Empresa...")
            page.wait_for_selector("text=SELECCIONAR", timeout=15000)
            page.click("text=SELECCIONAR")

            print("3. Entrando al módulo de Recepción via Menú Lateral...")
            # En lugar de URL directa (que dio 404), usamos el selector visual
            page.wait_for_selector("text=Recepción de Documentos", timeout=15000)
            page.click("text=Recepción de Documentos")

            # Respiro visual para dar margen a renderizados asíncronos (SPA de Vue/React de Lioren)
            time.sleep(5) 
            
            print(f"4. Interfaz cargada. Listo para interactuar.")
            
            # Lioren suele tener un botón de "Exportar" con un icono de Excel
            print("5. Buscando botón de exportación...")
            # Intentamos varios selectores comunes en el portal
            export_selectors = [
                "button:has-text('Exportar')",
                "a:has-text('Excel')",
                ".md-button:has-text('Descargar')",
                "[aria-label='Exportar']"
            ]
            
            with page.expect_download(timeout=60000) as download_info:
                found = False
                for sel in export_selectors:
                    try:
                        if page.locator(sel).is_visible(timeout=2000):
                            page.click(sel)
                            found = True
                            break
                    except: continue
                
                if not found:
                    print("--> MODO ASISTENCIA: No encontré el botón. Por favor haz click en 'Exportar' en la ventana del navegador.")
                    # Espera indefinida a que el usuario lo haga (Playwright esperará al evento download)
            
            download = download_info.value
            filepath = os.path.join(download_dir, f"compras_{mes_desde}_a_lioren.xlsx")
            download.save_as(filepath)
            
            print(f"EXTRACCION EXITOSA! Archivo guardado en: {filepath}")
            
            # --- VALIDAR CONTENIDO ---
            if os.path.getsize(filepath) < 100:
                print("⚠️ ADVERTENCIA: El archivo descargado parece estar vacio o corrupto.")
                return

            print("6. INICIANDO INYECCION AL ERP...")
            procesar_archivo_excel(filepath)
            print("FLUJO ETL COMPLETADO CON EXITO.")
            
        except Exception as e:
            print(f"Error en la automatizacion capturado por el sistema: {e}")
            page.screenshot(path="lioren_error_state.png")
            print("Se ha guardado 'lioren_error_state.png' para diagnostico.")
        finally:
            browser.close()

if __name__ == "__main__":
    if not EMAIL or not PWD:
        print("SEGURIDAD: Faltan credenciales LIOREN en tu archivo maestro .env")
    else:
        # Por defecto bajamos el mes actual (Abril 2026)
        descargar_compras_lioren("2026-04-01", "2026-04-30")
