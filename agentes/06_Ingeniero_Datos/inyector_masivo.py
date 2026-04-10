import os
import glob
from procesar_facturas_lioren import procesar_archivo_excel

def inyector_masivo_2026():
    print("=======================================")
    print(" INICIANDO INYECCION MASIVA LIOREN 2026")
    print("=======================================")
    
    # Directorio donde se esperan los archivos (lioren/2026)
    folder_2026 = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lioren', '2026')
    
    # Buscar todos los excel (.xlsx y .xls)
    archivos = glob.glob(os.path.join(folder_2026, '*.xls*'))
    
    if not archivos:
        print("[!] No se encontraron planillas Excel en la carpeta lioren/2026.")
        print("-> Por favor, descarga las facturas y ponlas alli.")
        return

    print(f"[*] Se detectaron {len(archivos)} planillas de compras. Iniciando Pipeline...")
    
    for arc in archivos:
        filename = os.path.basename(arc)
        print(f"\\n---> EXTRAYENDO DATOS DE: {filename} <---")
        procesar_archivo_excel(arc)
        
    print("\\n=======================================")
    print(" OPERACION MASIVA FINALIZADA CON EXITO")
    print(" Las facturas han sido derivadas a la DB.")
    print("=======================================")

if __name__ == "__main__":
    inyector_masivo_2026()
