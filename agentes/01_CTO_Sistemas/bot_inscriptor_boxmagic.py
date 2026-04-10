
import os
import sys
import time
from playwright.sync_api import sync_playwright

# Configuración de BoxMagic
BOXMAGIC_URL = "https://auth.boxmagic.cl/login/"
SWITCH_URL = "https://boxmagic.cl/home/out_box"
CENTROS = {
    "CAMPANARIO": "R7XLbnaLV5", # ID 1385
    "MARINA": "VWQDqk1489"      # ID 1077
}

def bot_inscribir_y_activar(email_admin, password_admin, sede, alumno_data):
    """
    Inscribe y activa un plan para un alumno.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True) # Modo servidor
        context = browser.new_context()
        page = context.new_page()
        
        try:
            print(f"--- Iniciando inscripción: {alumno_data['nombre']} {alumno_data['apellido']} ---")
            
            # 1. Login
            page.goto(BOXMAGIC_URL)
            page.fill("input[name='email']", email_admin)
            page.fill("input[name='password']", password_admin)
            page.click("button[type='submit']")
            page.wait_for_load_state("networkidle")
            
            # 2. Cambiar de Sede a Campanario
            page.goto(SWITCH_URL)
            page.select_option("select[name='box_id']", CENTROS["CAMPANARIO"])
            page.click("button:has-text('Entrar')")
            page.wait_for_load_state("networkidle")

            # 3. Registrar Alumno
            page.click("button:has-text('Ingresar cliente')")
            page.wait_for_selector("#addAlumnoModal")
            page.fill("#name_alumno", alumno_data['nombre'])
            page.fill("#last_name_alumno", alumno_data['apellido'])
            page.fill("#email_alumno", alumno_data['email'])
            
            # Campos opcionales (RUT dummy)
            page.click("text=Ver registro completo")
            page.fill("#rut_alumno", "1-9")
            
            print("Presionando 'Agregar cliente'...")
            page.click("#save_alumno")
            time.sleep(3) # Esperar cierre de modal

            # 4. Activar Plan
            # Buscamos al alumno recién creado en la lista
            page.goto("https://boxmagic.cl/clientes/listado")
            page.fill("input[type='search']", alumno_data['email'])
            page.keyboard.press("Enter")
            time.sleep(2)
            
            # Click en el alumno (asumiendo que es el primero en la tabla)
            page.click("table tbody tr:first-child td:nth-child(2) a")
            page.wait_for_load_state("networkidle")
            
            # Nueva Venta / Plan
            page.click("button:has-text('Nueva venta')")
            # Selección de PLAN ADMIN (esto es variable, asumo selector por texto)
            # Nota: PLAN ADMIN usualmente es una membresía de cortesía
            # page.select_option("#plan_id", label="PLAN ADMIN") 
            # page.fill("#monto_pago", "0")
            # page.click("#save_venta")
            
            print(f"ÉXITO: Alumno {alumno_data['email']} registrado en Campanario.")
            
        except Exception as e:
            print(f"ERROR: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    alumno = {
        "nombre": "Alumno",
        "apellido": "boos 3",
        "email": "alumnoboos3@gmail.com"
    }
    bot_inscribir_y_activar("contactoboosbox@gmail.com", "#Campa2024", "CAMPANARIO", alumno)
