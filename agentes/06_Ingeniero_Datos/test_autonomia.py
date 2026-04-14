import os
import time
from playwright.sync_api import sync_playwright
from datetime import datetime

# --- CONFIGURACION DE SESION DEDICADA ---
# Usamos una carpeta propia para el bot para evitar conflictos con tu Chrome personal
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
USER_DATA_DIR = os.path.join(SCRIPT_DIR, "boxmagic_session")
os.makedirs(USER_DATA_DIR, exist_ok=True)


def log(msg):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [BOXMAGIC-BOT] {msg}")

def ejecutar_robot_boxmagic():
    with sync_playwright() as p:
        log("--- Iniciando Bot BoxMagic con Sesion Dedicada ---")
        
        # Lanzamos el contexto persistente (esto guardará tus cookies localmente)
        try:
            context = p.chromium.launch_persistent_context(
                USER_DATA_DIR,
                channel="chrome", 
                headless=True,
                args=["--start-maximized"],

                no_viewport=True,
                accept_downloads=True
            )
        except Exception as e:
            log(f"❌ Error al abrir el perfil: {e}")
            log("Asegúrate de cerrar todas las ventanas de Chrome de 'THE BOOS' antes de correr el bot.")
            return

        page = context.new_page()
        
        try:
            log("1. Navegando a BoxMagic (Auth)...")
            page.goto("https://auth.boxmagic.cl", wait_until="domcontentloaded", timeout=60000)
            
            # Verificamos estado
            log(f"URL Actual: {page.url}")

            log("Por favor, inicia sesion en la ventana que se abrio.")
            
            # Esperamos hasta 5 minutos o hasta que el usuario cierre la ventana
            log("Esperando 5 minutos para que realices el login...")
            for _ in range(150): # 150 * 2s = 300s
                time.sleep(2)
                if len(context.pages) == 0: 
                    log("Ventana cerrada por el usuario.")
                    break
                # Si detectamos que ya no estamos en login ni en home, asumimos exito
                curr_url = page.url.lower()
                log(f"URL: {curr_url}")
                if "dashboard" in curr_url or "ventas" in curr_url or "panel" in curr_url or "admin" in curr_url:

                    log(f"Parece que entraste con exito: {curr_url}")
                    # Tomamos un screenshot del dashboard para identificar botones despues
                    page.screenshot(path="boxmagic_dashboard.png")
                    break
            
            log("Fase de login terminada o ventana cerrada.")

        except Exception as e:
            log(f"ERROR: {repr(e)}")
            page.screenshot(path="boxmagic_error.png")
        finally:
            context.close()

if __name__ == "__main__":
    ejecutar_robot_boxmagic()
