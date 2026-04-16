import os
import time
import sys
import io
from playwright.sync_api import sync_playwright
from datetime import datetime, date
from dotenv import load_dotenv

# ─── ENCODING ────────────────────────────────────────────────────────────────
if os.name == 'nt':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf8')

# ─── CONFIGURACIÓN ───────────────────────────────────────────────────────────
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
DOWNLOAD_DIR = os.path.join(SCRIPT_DIR, "boxmagic")
load_dotenv(os.path.join(SCRIPT_DIR, '../../.env'))

BM_EMAIL = os.getenv("BOXMAGIC_EMAIL", "contactoboosbox@gmail.com")
BM_PWD   = os.getenv("BOXMAGIC_PASSWORD", "#Campa2024") # Usando password detectado en capturas

SEES = [
    {"nombre": "Marina",     "id": "VWQDqk1489", "logo": "The boos box"},
    {"nombre": "Campanario", "id": "R7XLbnaLV5", "logo": "The boos Box Campanario"},
]

PERIODOS = [
    {"mes": "02", "nombre": "Febrero", "inicio": "01/02/2026", "fin": "28/02/2026"},
    {"mes": "03", "nombre": "Marzo",   "inicio": "01/03/2026", "fin": "31/03/2026"},
]

def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] [HISTORICO-BOT] {msg}", flush=True)

def descargar_periodo(page, sede, periodo):
    log(f"Iniciando descarga: {sede['nombre']} -> {periodo['nombre']} 2026")
    
    # Navegar a reportes (asumimos que ya estamos logueados y en el panel)
    try:
        page.get_by_role("link", name="Reportes").first.click(force=True)
        time.sleep(3)
        page.locator("div.card:has-text('Reporte de pagos')").locator("text=Ver Sección").first.click(force=True)
        time.sleep(5)

        # SELECCIÓN DE FECHAS (Basado en UI de BoxMagic)
        log(f"Buscando selector de fechas para {periodo['inicio']} - {periodo['fin']}...")
        input_fechas = page.locator("input#reservation, input.daterangepicker-input, #reportrange").first
        input_fechas.click()
        
        # En daterangepicker de Bootstrap se suelen tipear las fechas
        # O usar los ninputs de start/end si son visibles
        page.keyboard.type(f"{periodo['inicio']} - {periodo['fin']}")
        page.keyboard.press("Enter")
        time.sleep(5) # Esperar recarga de tabla

        filename = f"boxmagic_{sede['nombre']}_{periodo['nombre']}_2026.csv"
        # Organizar en subcarpata por sede
        sede_dir = os.path.join(DOWNLOAD_DIR, sede['nombre'].lower())
        os.makedirs(sede_dir, exist_ok=True)
        filepath = os.path.join(sede_dir, filename)

        with page.expect_download(timeout=60000) as dl_info:
            page.locator("button:has-text('CSV')").first.click(force=True)

        dl_info.value.save_as(filepath)
        log(f"✅ Descarga exitosa: {filepath}")
        return filepath
    except Exception as e:
        log(f"❌ Error en periodo {periodo['nombre']}: {e}")
        page.screenshot(path=os.path.join(SCRIPT_DIR, f"error_{sede['nombre']}_{periodo['nombre']}.png"))
        return None

def ejecutar_recuperacion():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(no_viewport=True, accept_downloads=True)
        page = context.new_page()

        try:
            log("Iniciando sesión en BoxMagic...")
            page.goto("https://auth.boxmagic.cl/login", wait_until="domcontentloaded", timeout=90000)
            page.locator("input[type='email']").fill(BM_EMAIL)
            page.locator("input[type='password']").fill(BM_PWD)
            page.locator("text=Ingresar").click(force=True)
            time.sleep(10)
            
            page.locator("text=Panel de administración").click(force=True)
            time.sleep(15)

            for sede in SEES:
                log(f"\n--- SEDE: {sede['nombre']} ---")
                
                # Cambio de Sede
                page.goto("https://boxmagic.cl/home/out_box", wait_until="domcontentloaded", timeout=90000)
                time.sleep(5)
                page.select_option("select#boxes", value=sede['id'])
                page.locator("button:has-text('Entrar')").click(force=True)
                time.sleep(10)

                for periodo in PERIODOS:
                    descargar_periodo(page, sede, periodo)

        except Exception as e:
            log(f"ERROR CRITICO: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    ejecutar_recuperacion()
