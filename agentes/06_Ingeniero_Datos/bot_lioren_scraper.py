import os
import time
import re
import hashlib
import sys
import io
from playwright.sync_api import sync_playwright
from dotenv import load_dotenv
from procesar_facturas_lioren import procesar_archivo_excel

# Aseguramos que la salida de consola sea amigable con Windows
if os.name == 'nt':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf8')

def log(msg):
    print(msg, flush=True)

# Cargar variables de entorno
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../.env'))

LIOREN_URL = "https://cl.lioren.enterprises/login"
EMAIL = os.getenv("LIOREN_EMAIL")
PWD = os.getenv("LIOREN_PASSWORD")

def descargar_y_procesar(page, download_dir, filename, mes_desde):
    log(f"\n--> Iniciando descarga para: {filename}")
    
    try:
        # 1. Esperar a que el botón de filtros (embudo) esté visible y hacer click
        log("Buscando botón de Filtros (Embudo)...")
        page.locator(".fa-filter").first.wait_for(state="visible", timeout=15000)
        page.locator(".fa-filter").first.click()
        
        # 2. Configurar el rango de fechas si es necesario (Opcional si ya viene en la URL)
        # Por ahora confiamos en la URL, pero el panel de filtros ayuda a asegurar visibilidad
        
        # 3. Hacer click en 'BUSCAR DOCUMENTOS' (Botón verde grande en el panel)
        log("Haciendo click en 'BUSCAR DOCUMENTOS'...")
        page.get_by_text("BUSCAR DOCUMENTOS").click()
        time.sleep(3) # Esperar refresco de tabla

        # 4. Localizar el icono de Excel (fa-file-excel-o)
        log("Detectando icono de descarga Excel...")
        excel_btn = page.locator(".fa-file-excel-o").first
        excel_btn.wait_for(state="visible", timeout=20000)
        
        with page.expect_download(timeout=60000) as download_info:
            excel_btn.click()
            download = download_info.value
            
        filepath = os.path.join(download_dir, filename)
        download.save_as(filepath)
        log(f"✅ Descargado: {filepath}")
        
        # Procesar e Inyectar al ERP
        procesar_archivo_excel(filepath)
        
    except Exception as e:
        log(f"❌ Error en descarga: {repr(e)}")

def ejecutar_robot_lioren(mes_desde="2026-04-01"):
    download_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lioren', '2026')
    os.makedirs(download_dir, exist_ok=True)

    with sync_playwright() as p:
        log("🚀 INICIANDO SUPER-BOT LIOREN v7.0 (FULL SCAN)...")
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(accept_downloads=True)
        page = context.new_page()

        try:
            log("1. Acceso...")
            page.goto(LIOREN_URL)
            page.fill("input[name='email']", EMAIL)
            page.fill("input[type='password']", PWD)
            page.click("button:has-text('INICIAR SESIÓN')")
            
            log("2. Selección de Empresa...")
            try:
                # Intentar varias estrategias de selección
                selector_exito = False
                for strategy in ["text='SELECCIONAR'", "button:has-text('SELECCIONAR')", ".btn-success", "a:has-text('SELECCIONAR')"]:
                    try:
                        log(f"   Intentando estrategia: {strategy}")
                        page.wait_for_selector(strategy, timeout=10000)
                        page.locator(strategy).first.click()
                        selector_exito = True
                        break
                    except:
                        continue
                
                if not selector_exito:
                    raise Exception("No se encontró el botón SELECCIONAR con ninguna estrategia.")
                    
            except Exception as e:
                log(f"⚠️ Error en selector: {e}. Intentando click forzado en texto...")
                page.get_by_text("SELECCIONAR").first.click(force=True)
            
            time.sleep(3)
            
            # --- CATEGORÍAS A DESCARGAR ---
            modulos = [
                {"nombre": "FACTURAS (RECEPCION)", "url": "https://cl.lioren.enterprises/empresas/the-boos-box-spa#/recepcion", "file": "facturas"},
                {"nombre": "BOLETAS EXENTAS", "url": f"https://cl.lioren.enterprises/empresas/the-boos-box-spa#/boletaexentas?fecha0={mes_desde}", "file": "boletas_exentas"},
                {"nombre": "NOTAS DE CRÉDITO", "url": "https://cl.lioren.enterprises/empresas/the-boos-box-spa#/notacredito", "file": "notas_credito"}
            ]

            for mod in modulos:
                log(f"\n📂 PROCESANDO MÓDULO: {mod['nombre']}")
                # Usamos domcontentloaded para evitar esperas eternas por analíticas/publicidad
                page.goto(mod['url'], wait_until="domcontentloaded", timeout=45000)
                time.sleep(5) # Espera humana para renderizado
                descargar_y_procesar(page, download_dir, f"{mod['file']}_{mes_desde}.xlsx", mes_desde)

            log("\n✨ PROCESO DIARIO COMPLETADO ✨")

        except Exception as e:
            log(f"💥 ERROR EN SESION: {repr(e)}")
            page.screenshot(path="lioren_debug_error.png")
        finally:
            browser.close()


if __name__ == "__main__":
    if not EMAIL or not PWD:
        log("❌ ERROR: Faltan credenciales en .env")
    else:
        # Descargamos todo Abril 2026
        ejecutar_robot_lioren("2026-04-01")
