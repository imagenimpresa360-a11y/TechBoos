import os
import time
import sys
import io
import re
from playwright.sync_api import sync_playwright
from datetime import datetime, date
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# ─── ENCODING (Windows UTF-8) ────────────────────────────────────────────────
if os.name == 'nt':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf8')

# ─── RUTAS Y CONFIGURACIÓN ───────────────────────────────────────────────────
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
SESSION_DIR  = os.path.join(SCRIPT_DIR, "boxmagic_session")
DOWNLOAD_DIR = os.path.join(SCRIPT_DIR, "boxmagic")
os.makedirs(SESSION_DIR,  exist_ok=True)
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# Cargar .env desde raíz del proyecto
load_dotenv(os.path.join(SCRIPT_DIR, '../../.env'))
BM_EMAIL = os.getenv("BOXMAGIC_EMAIL", "contactoboosbox@gmail.com")
BM_PWD   = os.getenv("BOXMAGIC_PASSWORD", "")   # Agregar al .env

# ─── BASE DE DATOS ────────────────────────────────────────────────────────────
DB_URL = "postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway"
engine = create_engine(DB_URL)

# ─── SEDES A PROCESAR ────────────────────────────────────────────────────────
SEDES = [
    {"nombre": "Marina",     "id": "VWQDqk1489", "logo": "The boos box"},
    {"nombre": "Campanario", "id": "R7XLbnaLV5", "logo": "The boos Box Campanario"},
]

# ─── HELPERS ──────────────────────────────────────────────────────────────────
def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] [BOXMAGIC-BOT] {msg}", flush=True)

def check_sede_logo(page, expected_logo_text):
    """Verifica que el logo en la parte superior izquierda coincida con la sede."""
    try:
        # Probamos varios selectores posibles para el logo/nombre de sede
        logo = page.locator(".navbar-brand, .navbar-header, #logo-text, .brand-text").first
        logo.wait_for(state="visible", timeout=5000)
        current_text = logo.inner_text().strip()
        log(f"Nombre de sede actual detectado: '{current_text}'")
        return expected_logo_text.lower() in current_text.lower()
    except:
        return False

# ─── CAMBIO DE SEDE ───────────────────────────────────────────────────────────
def cambiar_sede(page, sede: dict):
    """Navega a la pantalla 'Cambiar Centro' y selecciona la sede por ID interno."""
    log(f"Cambiando a sede: {sede['nombre']} (ID {sede['id']})...")
    
    page.goto("https://boxmagic.cl/home/out_box", wait_until="domcontentloaded", timeout=90000)
    time.sleep(2)
    
    try:
        # El selectpicker de bootstrap oculta el select original, intentamos seleccion directa
        log("Buscando selector de centros...")
        page.select_option("select#boxes", value=sede['id'])
        time.sleep(1)
        # Clic en Entrar
        page.locator("button:has-text('Entrar')").first.click(force=True)
        log("Clic en Entrar enviado.")
    except Exception as e:
        log(f"Fallo al seleccionar sede {sede['nombre']}: {e}")
        # Intento alternativo via texto en el dropdown visual
        page.locator(".filter-option-inner-inner").first.click()
        page.locator(f"span.text:has-text('{sede['nombre']}')").first.click()
        page.locator("button:has-text('Entrar')").click()

    time.sleep(8)
    log(f"Sede {sede['nombre']} activada.")

# ─── DESCARGA DE REPORTE ──────────────────────────────────────────────────────
def navegar_y_descargar(page, sede_dict) -> str | None:
    """Sigue la secuencia: Reportes -> Reporte de Pagos -> CSV"""
    sede_nombre = sede_dict['nombre']
    
    # 1. Asegurar que estamos en la sede correcta
    if not check_sede_logo(page, sede_dict['logo']):
        log(f"Sede incorrecta detectada. Reintento de cambio de sede...")
        cambiar_sede(page, sede_dict)
        if not check_sede_logo(page, sede_dict['logo']):
            log(f"ERROR: No se pudo verificar la sede {sede_nombre}. Abortando.")
            return None

    log(f"Iniciando descarga de reporte para {sede_nombre}...")

    try:
        # PASO 4: Menú Reportes
        page.get_by_role("link", name="Reportes").first.click(force=True)
        time.sleep(3)

        # PASO 5: Botón 'Ver Sección' del 'Reporte de pagos'
        log("Buscando botón 'Ver Sección' de pagos...")
        # Localizamos el título y subimos al contenedor padre para buscar el botón
        anchor_text = page.locator("text=Reporte de pagos").first
        anchor_text.wait_for(state="visible", timeout=15000)
        
        # Clic en el botón "Ver Sección" más cercano al texto "Reporte de pagos"
        page.locator("div.card:has-text('Reporte de pagos')").locator("text=Ver Sección").first.click(force=True)
        time.sleep(6)

        # PASO 6: Descarga CSV
        log("Preparando descarga CSV...")
        filename = f"boxmagic_{sede_nombre}_{date.today().strftime('%Y_%m_%d')}.csv"
        filepath = os.path.join(DOWNLOAD_DIR, filename)

        with page.expect_download(timeout=45000) as dl_info:
            # En la tabla de pagos, el botón CSV es el que queremos
            page.locator("button:has-text('CSV')").first.click(force=True)

        dl_info.value.save_as(filepath)
        log(f"✅ Descarga completada: {filepath}")
        return filepath

    except Exception as e:
        log(f"[ERROR] Fallo en secuencia para {sede_nombre}: {e}")
        page.screenshot(path=os.path.join(SCRIPT_DIR, f"error_seq_{sede_nombre}.png"))
        return None

# ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────
def ejecutar_robot_boxmagic():
    with sync_playwright() as p:
        log("=" * 60)
        log("  BOT BOXMAGIC v4.2 — INTELIGENCIA VISUAL + ID SLUGS")
        log("=" * 60)

        browser = p.chromium.launch(headless=False, args=["--start-maximized"])
        context = browser.new_context(no_viewport=True, accept_downloads=True)
        page = context.new_page()

        try:
            # ── PASO 1: LOGIN DIRECTO ─────────────────────────────────────
            log("PASO 1: Navegando a Login...")
            page.goto("https://auth.boxmagic.cl/login", wait_until="domcontentloaded", timeout=90000)
            
            # ── PASO 2: FORMULARIO ────────────────────────────────────────
            log("PASO 2: Login de Usuario...")
            page.locator("input[name='email'], input[type='email']").first.fill(BM_EMAIL)
            page.locator("input[name='password'], input[type='password']").first.fill(BM_PWD)
            page.locator("text=Ingresar").first.click(force=True)
            time.sleep(8)

            # ── PASO 3: PANEL DE ADMINISTRACIÓN ───────────────────────────
            log("PASO 3: Entrando al Panel...")
            btn_panel = page.locator("text=Panel de administración").first
            btn_panel.wait_for(state="visible", timeout=30000)
            btn_panel.click(force=True)
            time.sleep(10)

            # ── PASO 4: PROCESAR SEDES ────────────────────────────────────
            resultados = []
            for sede in SEDES:
                log(f"\n" + "·" * 40)
                log(f" PROCESANDO SEDE: {sede['nombre'].upper()}")
                log("·" * 40)
                
                archivo = navegar_y_descargar(page, sede)
                if archivo:
                    resultados.append(f"{sede['nombre']}: OK")
                else:
                    resultados.append(f"{sede['nombre']}: ERROR")

            # ── RESUMEN ───────────────────────────────────────────────────
            log("\n" + "=" * 60)
            log("  RESULTADOS FINALES")
            log("=" * 60)
            for r in resultados: log(f"  {r}")
            log("=" * 60)

        except Exception as e:
            log(f"[ERROR CRÍTICO] {str(e)}")
            page.screenshot(path=os.path.join(SCRIPT_DIR, "fatal_error_v4_2.png"))
        finally:
            log("Finalizando ejecución...")
            browser.close()


if __name__ == "__main__":
    ejecutar_robot_boxmagic()

