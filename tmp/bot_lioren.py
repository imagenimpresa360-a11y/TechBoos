import os
import time
from playwright.sync_api import sync_playwright

LIOREN_URL = "https://cl.lioren.enterprises/login"
EMAIL = "contactoboosbox@gmail.com"
PWD = "#Imagen2022"

def descargar_compras_lioren(mes_desde, mes_hasta):
    # Ruta donde queremos que caiga el archivo
    download_path = r"C:\Users\DELL\Desktop\TECHEMPRESA\tmp"
    
    with sync_playwright() as p:
        print("Iniciando Bot de Extracción Lioren...")
        browser = p.chromium.launch(headless=False) # Se ajustará a True en producción
        context = browser.new_context(accept_downloads=True)
        page = context.new_page()
        
        try:
            # 1. Autenticación
            print("1. Accediendo al portal...")
            page.goto(LIOREN_URL)
            # Rellenar credenciales
            page.fill("input[name='email']", EMAIL) 
            page.fill("input[type='password']", PWD)
            page.click("button[type='submit']")
            page.wait_for_load_state("networkidle")
            
            # 2. Pantalla "SELECCIÓN DE EMPRESA"
            print("2. Seleccionando Empresa THE BOOS BOX...")
            # Presionamos el botón verde SELECCIONAR
            page.click("button:has-text('SELECCIONAR')")
            page.wait_for_load_state("networkidle")
            
            # 3. Navegar a Recepción de Documentos
            print("3. Entrando a Recepción de Documentos -> Consultar recibidos")
            # Forzamos URl o clicamos en menú
            # Url estimada tras revisar la foto de Lioren:
            page.goto("https://cl.lioren.enterprises/empresas/the-boos-box-spa#/recepcion/documentos")
            page.wait_for_load_state("networkidle")
            
            # 4. Configurar fechas (Simulación de Filtros)
            print(f"4. Filtrando desde {mes_desde} hasta {mes_hasta}...")
            # Aquí se inyectan los selectores de fechas dependiendo del HTML real de Lioren
            # page.fill("input[name='fecha_inicio']", mes_desde)
            # page.fill("input[name='fecha_fin']", mes_hasta)
            # page.click("button:has-text('Buscar')")
            time.sleep(2) # Espera a que cargue la tabla
            
            # 5. Interceptar y ejecutar la descarga del CSV/Excel
            print("5. Solicitando descarga del libro de compras...")
            with page.expect_download() as download_info:
                # Clic en el botón Exportar o Descargar CSV/Excel
                page.click("button:has-text('Exportar')") 
            
            download = download_info.value
            
            # 6. Guardar archivo en nuestra carpeta local
            filepath = os.path.join(download_path, "compras_enero_lioren.csv")
            download.save_as(filepath)
            print(f"¡EXTRACCIÓN EXITOSA! Documento guardado en: {filepath}")
            
        except Exception as e:
            print(f"Error durante la automatización: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    descargar_compras_lioren("2026-01-01", "2026-01-31")
