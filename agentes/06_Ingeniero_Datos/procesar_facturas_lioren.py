import os
import requests
import pandas as pd
import math
from datetime import datetime

API_URL = "http://127.0.0.1:3001/api/compras"

def procesar_archivo_excel(filepath):
    print(f"\\n--- PROCESANDO LIOREN: {filepath} ---")
    try:
        df = pd.read_excel(filepath)
    except Exception as e:
        print(f"Error al leer el archivo Excel: {e}")
        return

    # Normalizar columnas segun el analisis del experto
    exitos = 0
    errores = 0

    for index, row in df.iterrows():
        try:
            # Extraer y limpiar datos
            folio = str(row.get('Folio', ''))
            if not folio or str(folio).lower() == 'nan':
                continue # Saltar filas invalidas

            rut = str(row.get('RUT', ''))
            proveedor = str(row.get('Razn Social', row.get('Razón Social', 'SIN NOMBRE')))
            
            fecha_raw = row.get('Fecha')
            if pd.isna(fecha_raw):
                fecha_emision = datetime.now().strftime('%Y-%m-%d')
            else:
                fecha_emision = str(fecha_raw).split(' ')[0]

            # En Lioren, el 'Monto Neto' a veces viene 0 en facturas exentas, asique sumamos ambos
            neto_puro = float(row.get('Monto Neto', 0)) if not pd.isna(row.get('Monto Neto')) else 0
            exento = float(row.get('Monto Exento', 0)) if not pd.isna(row.get('Monto Exento')) else 0
            neto_total = neto_puro + exento

            iva = float(row.get('Monto IVA', 0)) if not pd.isna(row.get('Monto IVA')) else 0
            total = float(row.get('Monto Total', 0)) if not pd.isna(row.get('Monto Total')) else 0

            payload = {
                "folio": folio,
                "rut": rut,
                "proveedor": proveedor,
                "fechaEmision": fecha_emision,
                "montoNeto": neto_total,
                "iva": iva,
                "montoTotal": total
            }

            # INYECCION AL BACKEND ERP
            response = requests.post(API_URL, json=payload)
            if response.status_code == 200:
                print(f"[OK] Factura Folio {folio} - {proveedor} inyectada.")
                exitos += 1
            else:
                print(f"[FAIL] Error Factura {folio}: {response.text}")
                errores += 1

        except Exception as e:
            print(f"[!] Error procesando fila {index}: {e}")
            errores += 1

    print(f"--- RESUMEN: {exitos} inyectados, {errores} errores ---")

if __name__ == "__main__":
    # Test file
    test_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lioren", "2025", "12-diciembre factura de compra.xlsx")
    if os.path.exists(test_path):
        procesar_archivo_excel(test_path)
    else:
        print("No se encontro archivo de prueba.")
