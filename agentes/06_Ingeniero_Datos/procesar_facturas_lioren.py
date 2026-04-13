import os
import pandas as pd
import math
from datetime import datetime
import uuid
from sqlalchemy import create_engine, text

# Conexión directa a la Base de Datos en la Nube (Railway)
# Esto permite que el bot funcione a las 3 AM sin depender del servidor local.
DATABASE_URL = "postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway"
engine = create_engine(DATABASE_URL)

def procesar_archivo_excel(filepath):
    print(f"\n--- PROCESANDO LIOREN (DIRECTO A CLOUD): {filepath} ---")
    try:
        df = pd.read_excel(filepath)
    except Exception as e:
        print(f"Error al leer el archivo Excel: {e}")
        return

    exitos = 0
    errores = 0

    with engine.begin() as conn:
        for index, row in df.iterrows():
            try:
                # Detectar Tipo de Documento
                tipo_doc = str(row.get('Tipo Documento', 'Factura Electrónica')).upper()
                is_boleta = "BOLETA" in tipo_doc
                
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

                # Montos
                neto_puro = float(row.get('Monto Neto', 0)) if not pd.isna(row.get('Monto Neto')) else 0
                exento = float(row.get('Monto Exento', 0)) if not pd.isna(row.get('Monto Exento')) else 0
                neto_total = neto_puro + exento
                iva = float(row.get('Monto IVA', 0)) if not pd.isna(row.get('Monto IVA')) else 0
                total = float(row.get('Monto Total', 0)) if not pd.isna(row.get('Monto Total')) else 0

                # Lógica de Notas de Crédito
                if "NOTA DE CRÉDITO" in tipo_doc or "NOTA DE CREDITO" in tipo_doc:
                    neto_total *= -1
                    iva *= -1
                    total *= -1

                # --- NUEVA LÓGICA DE FILTRADO ESTRICTO ---
                es_factura_real = "FACTURA" in tipo_doc and "ELECTRÓNICA" in tipo_doc
                es_nota_credito = "NOTA DE CRÉDITO" in tipo_doc or "NOTA DE CREDITO" in tipo_doc

                if is_boleta:
                    # BIFURCACIÓN HACIA VENTAS OFICIALES (Ingresos)
                    check = conn.execute(text('SELECT id FROM "VentaOficial" WHERE folio = :f AND tipo = :t LIMIT 1'), {"f": folio, "t": tipo_doc})
                    if check.fetchone():
                        continue
                    
                    conn.execute(text("""
                        INSERT INTO "VentaOficial" (id, folio, fecha, monto, tipo, "updatedAt") 
                        VALUES (:id, :f, :fe, :m, :t, NOW())
                    """), {
                        "id": str(uuid.uuid4()), "f": folio, "fe": fecha_emision, "m": total, "t": tipo_doc
                    })
                    print(f"[OK] VENTA (Boleta) Folio {folio} inyectada.")
                
                elif es_factura_real and not es_nota_credito:
                    # BIFURCACIÓN HACIA COMPRAS (Facturas Reales de Gasto)
                    # Filtro adicional: Si no tiene proveedor o RUT, es ruido.
                    if proveedor == 'SIN NOMBRE' or rut == 'nan' or total <= 0:
                        continue

                    check = conn.execute(text('SELECT id FROM "FacturaCompra" WHERE folio = :f AND rut = :r LIMIT 1'), {"f": folio, "r": rut})
                    if check.fetchone():
                        continue

                    conn.execute(text("""
                        INSERT INTO "FacturaCompra" (id, folio, rut, proveedor, "fechaEmision", "montoNeto", iva, "montoTotal", status, "updatedAt") 
                        VALUES (:id, :f, :r, :p, :fe, :mn, :iva, :mt, :s, NOW())
                    """), {
                        "id": str(uuid.uuid4()), "f": folio, "r": rut, "p": proveedor, "fe": fecha_emision,
                        "mn": neto_total, "iva": iva, "mt": total, "s": 'Pendiente'
                    })
                    print(f"[OK] COMPRA (Factura) Folio {folio} inyectada.")
                
                else:
                    # Ignoramos Notas de Crédito y otros documentos en el libro de compras
                    # para mantener el reporte limpio de montos negativos.
                    print(f"[-] Documento folio {folio} ignorado (Tipo: {tipo_doc}).")

                
                exitos += 1

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
