import pandas as pd
import psycopg2
import os
import re

# CONFIG
DB_URL = "postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway"
BASE_DIR = r"c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic"

def limpiar_monto(monto_str):
    if pd.isna(monto_str): return 0
    # Quitar $, espacios y puntos de miles
    val = str(monto_str).replace('$', '').replace('.', '').strip()
    try:
        return int(val)
    except:
        return 0

def inyectar_archivo(filepath, sede, mes_nombre):
    try:
        # Intento de lectura robusta: El CSV viene con comillas dobles anidadas
        # Usamos latin-1 porque los archivos de BoxMagic suelen venir en ese encoding de Excel
        with open(filepath, 'r', encoding='latin-1', errors='ignore') as f:
            lines = f.readlines()
        
        if not lines: return 0
        
        # Procesar líneas: Quitar comillas exteriores y split por ","
        processed_data = []
        for line in lines:
            line = line.strip()
            if not line: continue
            # Limpiar comillas iniciales/finales
            if line.startswith('"') and line.endswith('"'): line = line[1:-1]
            
            # Split por "," (incluyendo las comillas remanentes)
            parts = [p.strip().strip('"').strip(':') for p in line.split(',"')]
            processed_data.append(parts)
        
        if len(processed_data) < 2: return 0
        
        header = processed_data[0]
        # Buscar índices de columnas necesarias
        try:
            idx_monto = -1
            idx_tipo = -1
            idx_fecha = -1
            idx_cliente = -1
            idx_vendedor = -1
            idx_plan = -1
            
            for i, h in enumerate(header):
                if 'Monto' in h: idx_monto = i
                if 'Tipo' in h: idx_tipo = i
                if 'Fecha de pago' in h: idx_fecha = i
                if 'Cliente' in h: idx_cliente = i
                if 'Vendedor' in h: idx_vendedor = i
                if 'Plan' in h: idx_plan = i
            
            if idx_monto == -1: raise Exception("No se encontró columna Monto")
        except Exception as e:
            print(f"Error en cabecera de {filepath}: {e} | Header: {header}")
            return -1

        registros = []
        for row in processed_data[1:]:
            if len(row) <= max(idx_monto, idx_tipo, idx_fecha): continue
            
            monto_val = limpiar_monto(row[idx_monto])
            if monto_val > 0:
                registros.append({
                    'fecha_pago': row[idx_fecha],
                    'cliente': row[idx_cliente] if idx_cliente != -1 else "Sin Información",
                    'monto': monto_val,
                    'tipo_pago': row[idx_tipo].strip().lower(),
                    'vendedor': row[idx_vendedor] if idx_vendedor != -1 else "Sin Información",
                    'sede': sede,
                    'mes': mes_nombre.lower(),
                    'plan': row[idx_plan] if idx_plan != -1 else "Sin Plan"
                })
        
        if not registros:
            return 0

        # Conexión y Carga
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        # 1. Limpiar mes anterior para evitar duplicados
        cur.execute("DELETE FROM boxmagic_sales WHERE sede = %s AND mes = %s", (sede, mes_nombre.lower()))
        
        # 2. Insertar nuevos
        query = """
            INSERT INTO boxmagic_sales (fecha_pago, cliente, monto, tipo_pago, vendedor, sede, mes, plan) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        data_to_insert = [
            (r['fecha_pago'], r['cliente'], r['monto'], r['tipo_pago'], r['vendedor'], r['sede'], r['mes'], r['plan']) 
            for r in registros
        ]
        cur.executemany(query, data_to_insert)
        
        conn.commit()
        cur.close()
        conn.close()
        return len(registros)
    except Exception as e:
        print(f"Error procesando {filepath}: {e}")
        return -1

def main():
    mapa_archivos = [
        # MARINA
        {"path": "marina/1.- enero boxmagic marina.csv", "sede": "Marina", "mes": "enero"},
        {"path": "marina/2.- febrero boxmagic marina.csv", "sede": "Marina", "mes": "febrero"},
        {"path": "marina/3.- marzo boxmagic marina.csv", "sede": "Marina", "mes": "marzo"},
        # CAMPANARIO
        {"path": "campanario/1.- enero BoxMagic (41).csv", "sede": "Campanario", "mes": "enero"},
        {"path": "campanario/2.- Febrero BoxMagic .csv", "sede": "Campanario", "mes": "febrero"},
        {"path": "campanario/3.- Marzo BoxMagic .csv", "sede": "Campanario", "mes": "marzo"},
    ]
    
    print("="*60)
    print("INYECTOR MASIVO DE HISTORIA BOXMAGIC 2026")
    print("="*60)
    
    for item in mapa_archivos:
        full_path = os.path.join(BASE_DIR, item['path'])
        if os.path.exists(full_path):
            n = inyectar_archivo(full_path, item['sede'], item['mes'])
            if n > 0:
                print(f"[OK] {item['sede']} - {item['mes'].capitalize()}: {n} registros cargados.")
            elif n == 0:
                print(f"[WARN] {item['sede']} - {item['mes'].capitalize()}: Sin datos válidos.")
        else:
            print(f"[ERROR] Archivo no encontrado: {item['path']}")

if __name__ == "__main__":
    import sys
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    main()
