import psycopg2
import csv
import os

# CONFIG
DB_URL = "postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway"
FILE_PATH = r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\marina\1.- enero boxmagic marina.csv'
SEDE = "Marina"
MES = "enero"

def clean_val(v):
    return v.strip('"').strip(':').strip()

def inject_data():
    print(f"--- INICIANDO INYECTOR SENIOR - SEDE: {SEDE} - MES: {MES} ---")
    
    # 1. Leer y parsear datos
    data_to_insert = []
    with open(FILE_PATH, 'r', encoding='latin-1') as f:
        lines = f.readlines()
        
    header = None
    for line in lines:
        line = line.strip()
        if not line: continue
        if line.startswith('"') and line.endswith('"'): line = line[1:-1]
        parts = [clean_val(p) for p in line.split(',"')]
        
        if not header:
            header = parts
            continue
            
        # Mapeo manual basado en el resumen anterior
        # Header: N°, Cliente:, Email:, Estado:, Plan, Fecha de pago, Fecha de Inicio, Tipo, Monto, Vendedor/a
        try:
            monto_str = parts[8].replace('$', '').replace('.', '').replace(' ', '')
            monto = int(monto_str)
            if monto <= 0: continue # Ignorar pruebas o ceros
            
            data_to_insert.append({
                'fecha_pago': parts[5],
                'cliente': parts[1],
                'monto': monto,
                'tipo_pago': parts[7],
                'vendedor': parts[9],
                'sede': SEDE,
                'mes': MES
            })
        except Exception as e:
            continue

    print(f"Parsed {len(data_to_insert)} valid records.")

    # 2. Conexión DB
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        # 3. Limpieza de seguridad (Idempotencia)
        # Borramos lo que ya exista para esta sede/mes para evitar duplicados en el re-intento
        print(f"Limpiando registros previos de {SEDE} para {MES}...")
        cur.execute("DELETE FROM boxmagic_sales WHERE sede = %s AND mes = %s", (SEDE, MES))
        deleted = cur.rowcount
        print(f"Registros previos eliminados: {deleted}")

        # 4. Inserción Masiva
        query = """
            INSERT INTO boxmagic_sales (fecha_pago, cliente, monto, tipo_pago, vendedor, sede, mes)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        values = [
            (r['fecha_pago'], r['cliente'], r['monto'], r['tipo_pago'], r['vendedor'], r['sede'], r['mes'])
            for r in data_to_insert
        ]
        
        cur.executemany(query, values)
        conn.commit()
        
        print(f"--- INYECCION EXITOSA: {len(values)} registros insertados ---")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    inject_data()
