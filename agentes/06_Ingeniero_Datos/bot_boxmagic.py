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
    {"nombre": "Campanario", "codigo": "1385", "label": "1385"},
    {"nombre": "Marina",     "codigo": "1077", "label": "1077"},
]

# ─── HELPERS ──────────────────────────────────────────────────────────────────
def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] [BOXMAGIC-BOT] {msg}", flush=True)

def clean_amount(val):
    if pd.isna(val): return 0
    s = str(val).replace('$', '').replace('.', '').replace(' ', '').replace('"', '').strip()
    try:    return int(s)
    except: return 0

def url_reporte_mes() -> str:
    """Genera la URL del reporte de pagos para el mes actual."""
    hoy       = date.today().strftime("%Y-%m-%d")
    inicio    = date.today().replace(day=1).strftime("%Y-%m-%d")
    return (f"https://boxmagic.cl/reportes/reportes_pagos"
            f"?fecha_desde={inicio}&fecha_hasta={hoy}"
            f"&activos=undefined&coach_selected=&method=pagos")

# ─── INYECCIÓN ────────────────────────────────────────────────────────────────
def procesar_e_inyectar_ventas(file_path: str, sede_nombre: str) -> int:
    log(f"Analizando CSV para sede: {sede_nombre}...")
    try:
        df = pd.read_csv(file_path, encoding='utf-8', sep=None, engine='python')
        df.columns = [c.replace('"', '').replace(':', '').strip() for c in df.columns]
        log(f"Columnas detectadas: {list(df.columns)}")

        mes_actual = date.today().strftime('%B').lower()
        exitos = 0
        with engine.begin() as conn:
            for _, row in df.iterrows():
                cliente    = str(row.get('Cliente', 'Desconocido'))
                monto      = clean_amount(row.get('Monto', 0))
                tipo_pago  = str(row.get('Tipo', 'Otro'))
                vendedor   = str(row.get('Vendedor/a', 'Desconocido'))
                fecha_pago = str(row.get('Fecha de pago', row.get('Fecha', date.today().strftime('%Y-%m-%d'))))
                email      = str(row.get('Email', ''))
                plan       = str(row.get('Plan', ''))
                estado     = str(row.get('Estado', ''))

                # Anti-duplicado
                existe = conn.execute(text("""
                    SELECT id FROM boxmagic_sales
                    WHERE cliente = :c AND fecha_pago = :f AND monto = :m AND sede = :s
                    LIMIT 1
                """), {"c": cliente, "f": fecha_pago, "m": monto, "s": sede_nombre}).fetchone()

                if existe:
                    continue

                conn.execute(text("""
                    INSERT INTO boxmagic_sales
                        (fecha_pago, cliente, monto, tipo_pago, vendedor, sede, mes)
                    VALUES (:f, :c, :m, :t, :v, :s, :me)
                """), {
                    "f": fecha_pago, "c": cliente,
                    "m": monto, "t": tipo_pago, "v": vendedor,
                    "s": sede_nombre, "me": mes_actual
                })
                exitos += 1

        log(f"[OK] {exitos} registros nuevos inyectados en Railway para {sede_nombre}.")
        return exitos
    except Exception as e:
        log(f"[ERROR] Fallo al procesar CSV: {e}")
        return 0

# ─── CAMBIO DE SEDE ───────────────────────────────────────────────────────────
def cambiar_sede(page, sede: dict):
    """Navega a la pantalla 'Cambiar Centro' y selecciona la sede por código."""
    log(f"Cambiando a sede: {sede['nombre']} (código {sede['codigo']})...")

    # 1. Clic en "Mi cuenta" en el navbar superior (hay múltiples elementos con ese texto)
    page.get_by_role("banner").locator("a").filter(has_text="Mi cuenta").click()
    time.sleep(1)

    # 2. Clic en "Cambiar cuenta" — usar el link de rol (todos tienen la misma URL)
    page.get_by_role("link", name="Cambiar cuenta").click()
    # 3. Seleccionar la sede por el texto que contiene el código
    # La página out_box muestra un dropdown - navegamos directamente a la URL
    # ya que todos los links de "Cambiar cuenta" llevan a /home/out_box
    page.wait_for_url("**/home/out_box", timeout=20000)
    time.sleep(2)
    # 3. Seleccionar la sede en el <select> nativo de HTML por código
    # Nota: select_option no acepta regex - usamos JS para buscar la opción
    select_el = page.locator("select").first
    select_el.wait_for(state="visible", timeout=10000)
    # Obtener todas las opciones y buscar la que contiene el código
    options = select_el.locator("option").all()
    for opt in options:
        label_text = opt.inner_text()
        if sede['codigo'] in label_text:
            val = opt.get_attribute("value")
            select_el.select_option(value=val)
            log(f"Sede seleccionada: {label_text.strip()}")
            break

    time.sleep(4)  # Esperar que cargue el nuevo contexto de sede
    log(f"Sede {sede['nombre']} activa.")

# ─── DESCARGA DE REPORTE ──────────────────────────────────────────────────────
def descargar_reporte(page, sede_nombre: str) -> str | None:
    """Navega al reporte de pagos, aplica filtro del mes actual y descarga CSV."""
    log(f"Navegando al reporte de pagos ({sede_nombre})...")

    # Ir directamente a la URL con filtros pre-aplicados (más estable que simular clics)
    page.goto(url_reporte_mes(), wait_until="domcontentloaded", timeout=60000)
    time.sleep(5)  # Esperar renderizado de tabla

    log("Descargando CSV...")
    try:
        filename = f"boxmagic_{sede_nombre}_{date.today().strftime('%Y_%m_%d')}.csv"
        filepath = os.path.join(DOWNLOAD_DIR, filename)

        with page.expect_download(timeout=30000) as dl_info:
            # El primero es el botón de la tabla principal de Pagos Ingresados
            page.get_by_role("button", name="CSV").first.click()

        dl_info.value.save_as(filepath)
        log(f"Descarga exitosa: {filepath}")
        return filepath
    except Exception as e:
        log(f"[ERROR] Fallo en descarga para {sede_nombre}: {e}")
        page.screenshot(path=os.path.join(SCRIPT_DIR, f"error_{sede_nombre}.png"))
        return None

# ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────
def ejecutar_robot_boxmagic():
    with sync_playwright() as p:
        log("=" * 60)
        log("  BOT BOXMAGIC v3.0 — MULTISEDE (Campanario + Marina)")
        log("=" * 60)

        # Contexto persistente: recuerda el login entre ejecuciones
        context = p.chromium.launch_persistent_context(
            SESSION_DIR,
            channel="chrome",
            headless=False,
            args=["--start-maximized"],
            no_viewport=True,
            accept_downloads=True
        )
        page = context.new_page()

        try:
            # ── PASO 1: LOGIN ─────────────────────────────────────────────
            log("PASO 1: Autenticando en BoxMagic...")
            page.goto("https://auth.boxmagic.cl/login/", wait_until="domcontentloaded", timeout=60000)
            time.sleep(3)

            # Detectar si hay formulario de login (campo email visible = sesión no guardada)
            necesita_login = page.locator("input[data-bmid='input-email-ingreso']").is_visible(timeout=3000)
            if necesita_login:
                log("Formulario de login detectado. Realizando login programatico...")
                page.fill("input[data-bmid='input-email-ingreso']", BM_EMAIL)
                page.fill("input[data-bmid='input-password-ingreso']", BM_PWD)
                page.click("button[data-bmid='btn-ingresar']")
                log("Credenciales enviadas. Esperando respuesta del servidor...")
                time.sleep(5)
                # Verificar que el login fue exitoso
                if not page.get_by_text("Panel de administración").is_visible(timeout=15000):
                    log("[ERROR] No se pudo autenticar. Verifica BOXMAGIC_EMAIL y BOXMAGIC_PASSWORD en .env")
                    page.screenshot(path=os.path.join(SCRIPT_DIR, "boxmagic_login_error.png"))
                    return
            else:
                log("Sesion persistente activa. No se requiere login.")

            # ── PASO 2: ENTRAR AL PANEL ADMIN ────────────────────────────
            log("PASO 2: Entrando al Panel de Administración...")
            page.screenshot(path=os.path.join(SCRIPT_DIR, "boxmagic_step2_debug.png"))
            log(f"URL actual: {page.url}")
            # Los botones son directamente clicables por texto (confirmado en screenshot)
            # NOTA: un <button aria-label="Boton"> vacío envuelve el div y bloquea el clic normal.
            # force=True dispara el evento click directamente sobre el elemento sin importar superposiciones.
            try:
                page.get_by_text("Panel de administración", exact=True).click(force=True, timeout=15000)
                log("Click forzado en Panel de administracion realizado.")
                # Esperar que la nueva página cargue
                page.wait_for_url("https://boxmagic.cl/**", timeout=30000)
            except Exception as e:
                log(f"No se pudo entrar al panel: {e}")
                raise e
            log(f"Panel cargado. URL: {page.url}")
            time.sleep(2)

            # ── PASO 3: CICLO MULTISEDE ───────────────────────────────────
            resultados = {}
            for i, sede in enumerate(SEDES):
                log(f"\n{'─'*50}")
                log(f"PROCESANDO SEDE {i+1}/{len(SEDES)}: {sede['nombre'].upper()}")
                log(f"{'─'*50}")

                # Si no es la primera sede, cambiar el centro activo
                if i > 0:
                    cambiar_sede(page, sede)

                # Descargar el reporte
                archivo = descargar_reporte(page, sede["nombre"])

                if archivo:
                    # Inyectar a Railway
                    n = procesar_e_inyectar_ventas(archivo, sede["nombre"])
                    resultados[sede["nombre"]] = n
                else:
                    resultados[sede["nombre"]] = "ERROR"

            # ── RESUMEN FINAL ─────────────────────────────────────────────
            log("\n" + "=" * 60)
            log("  RESUMEN DE SINCRONIZACION")
            log("=" * 60)
            for sede_nombre, n in resultados.items():
                estado = f"{n} registros nuevos" if isinstance(n, int) else n
                log(f"  {sede_nombre:15s}: {estado}")
            log("=" * 60)

        except Exception as e:
            log(f"[ERROR CRITICO] {str(e)}")
            page.screenshot(path=os.path.join(SCRIPT_DIR, "boxmagic_fatal_error.png"))
        finally:
            log("Cerrando bot...")
            try:
                context.close()
            except:
                pass
            log("Bot finalizado.")

# ─── ENTRY POINT ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    ejecutar_robot_boxmagic()
