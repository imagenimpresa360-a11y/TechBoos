import os
import csv
import psycopg2
import sys
from dotenv import load_dotenv

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

DB_URL = os.getenv('DATABASE_URL')
FILE_PATH = r"C:\PROYECTO DEV\AG TBB\agentes\06_Ingeniero_Datos\boxmagic\campanario\2026\5.- Mayo boxmagic al 08052025.csv"

def procesar_ventas():
    print(f"🚀 Procesando ventas de Mayo 2026 (Formato Limpio)...")
    
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        with open(FILE_PATH, mode='r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile, delimiter=';')
            
            actualizados = 0
            for row in reader:
                # Limpiar nombres de columnas (quitar los dos puntos)
                clean_row = {k.replace(':', '').strip(): v for k, v in row.items()}
                
                nombre = clean_row.get('Cliente', '').strip()
                email = clean_row.get('Email', '').strip().lower()
                estado = clean_row.get('Estado', '').strip().capitalize()
                monto_str = clean_row.get('Monto', '$0').replace('$', '').replace('.', '').strip()
                monto = int(monto_str) if monto_str.lstrip('-').isdigit() else 0
                
                if not email or '@' not in email:
                    continue

                cur.execute("""
                    INSERT INTO socios (nombre, email, estado, sede_habitual, monto_promedio, updated_at)
                    VALUES (%s, %s, %s, 'Campanario', %s, NOW())
                    ON CONFLICT (email) 
                    DO UPDATE SET 
                        estado = EXCLUDED.estado,
                        monto_promedio = EXCLUDED.monto_promedio,
                        updated_at = NOW();
                """, (nombre, email, estado, monto))
                
                actualizados += 1

        conn.commit()
        cur.close()
        conn.close()
        print(f"✅ Proceso completado. {actualizados} registros actualizados en Mayo.")

    except Exception as e:
        print(f"❌ Error procesando el archivo: {e}")

if __name__ == "__main__":
    procesar_ventas()
