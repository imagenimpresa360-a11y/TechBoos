
import json
import os
import pandas as pd

# Rutas de Archivos base
PATH_BASE = r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes'
PATH_JSON = os.path.join(PATH_BASE, '02_CFO_Finanzas', 'DATOS_CONSOLIDADOS_2026.json')

def update_database():
    # Estructura inicial
    data = {
        "metas": {"punto_equilibrio": 6000000},
        "ingresos": {},
        "egresos": {
            "nominas": {},
            "gastos_fijos": {
                "administracion": 620000,
                "arriendos": 1000000,
                "aseo_extra": 120000,
                "tgr_convenios": 583200
            }
        },
        "alarmas": {
            "deuda_enel": 482707,
            "deuda_arriendos": 1450000
        }
    }

    # 1. Cargar Datos de Enero
    data["ingresos"]["enero"] = {"monto": 6500000, "fuente": "BoxMagic + VPost"}
    data["egresos"]["nominas"]["enero"] = {"bruto": 3420300, "neto": 2950000}

    # 2. Cargar Datos de Febrero
    data["ingresos"]["febrero"] = {"monto": 6200000, "fuente": "BoxMagic + VPost"}
    data["egresos"]["nominas"]["febrero"] = {"bruto": 3225508, "neto": 2782000}

    # 3. Cargar Datos de Marzo
    data["ingresos"]["marzo"] = {"monto": 7400000, "fuente": "BoxMagic + VPost"}
    data["egresos"]["nominas"]["marzo"] = {"bruto": 3564059, "neto": 3074000}

    # Guardar JSON final
    with open(PATH_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Base de datos unificada actualizada en: {PATH_JSON}")

if __name__ == "__main__":
    update_database()
