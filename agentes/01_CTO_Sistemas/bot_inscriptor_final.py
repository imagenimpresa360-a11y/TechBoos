
import time
from playwright.sync_api import sync_playwright

# Configuración
EMAIL_ADMIN = "contactoboosbox@gmail.com"
PASS_ADMIN = "#Campa2024"
CENTRO_ID = "R7XLbnaLV5" # Campanario

def run_inscription():
    with sync_playwright() as p:
        print("Iniciando navegador...")
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        try:
            print("Accediendo a Login...")
            page.goto("https://auth.boxmagic.cl/login/", timeout=60000)
            
            # Login con selectores robustos
            print("Llenando credenciales...")
            try:
                page.wait_for_selector("input#email", timeout=5000)
                page.fill("input#email", EMAIL_ADMIN)
            except:
                page.fill("input[placeholder='Correo']", EMAIL_ADMIN)
            
            try:
                page.fill("input#password", PASS_ADMIN)
            except:
                page.fill("input[placeholder='Contraseña']", PASS_ADMIN)
            
            page.click("button:has-text('Ingresar')")
            
            print("Esperando dashboard...")
            page.wait_for_url("**/dashboard**", timeout=60000)
            
            # Cambio de Sede
            print("Cambiando a Campanario...")
            page.goto("https://boxmagic.cl/home/out_box")
            page.select_option("select[name='box_id']", CENTRO_ID)
            page.click("button:has-text('Entrar')")
            page.wait_for_load_state("networkidle")

            # Registro de Alumno
            print("Abriendo formulario de inscripción...")
            # El botón puede tardar en aparecer tras el cambio de sede
            page.wait_for_selector("button:has-text('Ingresar cliente')", timeout=30000)
            page.click("button:has-text('Ingresar cliente')")
            
            print("Llenando datos del alumno...")
            page.wait_for_selector("#addAlumnoModal")
            page.fill("#name_alumno", "Alumno")
            page.fill("#last_name_alumno", "boos 3")
            page.fill("#email_alumno", "alumnoboos3@gmail.com")
            
            # Ver campos opcionales para RUT
            page.click("text=Ver registro completo")
            page.fill("#rut_alumno", "22.222.333-k")
            
            print("Guardando alumno...")
            page.click("#save_alumno")
            
            # Esperar confirmación (cierre de modal o mensaje)
            time.sleep(5)
            
            # Verificación en el listado
            print("Verificando en el listado de alumnos...")
            page.goto("https://boxmagic.cl/clientes/listado")
            page.wait_for_selector("input[type='search']")
            page.fill("input[type='search']", "alumnoboos3@gmail.com")
            page.keyboard.press("Enter")
            time.sleep(3)
            
            if "alumnoboos3@gmail.com" in page.content():
                print("¡ÉXITO TOTAL! Alumno 'Alumno boos 3' inscrito correctamente en Campanario.")
            else:
                print("ADVERTENCIA: No se encontró al alumno en el listado final.")

        except Exception as e:
            print(f"FALLO DURANTE LA EJECUCIÓN: {str(e)}")
            page.screenshot(path="error_inscription.png")
            print("Screenshot de error guardado.")
        
        finally:
            browser.close()
            print("Navegador cerrado.")

if __name__ == "__main__":
    run_inscription()
