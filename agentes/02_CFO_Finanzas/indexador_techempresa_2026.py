
import os
import json
import pandas as pd
from datetime import datetime

# CONFIGURACIÓN DE SEGURIDAD: Solo TECHEMPRESA
ROOT_DIR = r'c:\Users\DELL\Desktop\TECHEMPRESA'
OUTPUT_JSON = os.path.join(ROOT_DIR, 'agentes', '02_CFO_Finanzas', 'DATOS_CONSOLIDADOS_2026.json')

def index_techempresa():
    print(f"--- INICIANDO INDEXACIÓN SEGURA: {ROOT_DIR} ---")
    
    database = {
        "metadata": {
            "ultima_sincronizacion": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "scope": "STRICT_TECHEMPRESA_ONLY"
        },
        "entidades": {
            "boxmagic_files": [],
            "bancarios_files": [],
            "comprobantes_files": []
        }
    }

    for root, dirs, files in os.walk(ROOT_DIR):
        # Evitar carpetas de otros proyectos si estuvieran mapeadas (en este caso no deberían por el ROOT_DIR)
        for file in files:
            full_path = os.path.join(root, file)
            
            # Clasificación por patrones
            if "BoxMagic" in file and file.endswith(".csv"):
                database["entidades"]["boxmagic_files"].append(full_path)
            
            elif ("CARTOLA" in file.upper() or "TRANSFERENCIAS" in root.upper()) and file.endswith((".xlsx", ".xls")):
                database["entidades"]["bancarios_files"].append(full_path)
                
            elif "COMPROBANTES" in root.upper() and file.endswith(".pdf"):
                database["entidades"]["comprobantes_files"].append(full_path)

    # Escribir el índice de archivos para auditoría
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(database, f, indent=2, ensure_ascii=False)
    
    print(f"Indexación completada. Se encontraron {len(database['entidades']['boxmagic_files'])} archivos de BoxMagic.")
    print(f"Base de Datos Guardada: {OUTPUT_JSON}")

if __name__ == "__main__":
    if os.path.exists(ROOT_DIR):
        index_techempresa()
    else:
        print(f"ERROR: La ruta {ROOT_DIR} no es accesible.")
