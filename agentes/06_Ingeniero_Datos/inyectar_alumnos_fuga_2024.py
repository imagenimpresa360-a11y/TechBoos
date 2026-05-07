import os
import csv
import psycopg2
import sys
from dotenv import load_dotenv

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

DB_URL = os.getenv('DATABASE_URL')
PATH_2024 = r"C:\PROYECTO DEV\AG TBB\agentes\06_Ingeniero_Datos\boxmagic\campanario\2024"

def inyectar_fuga():
    print("🚀 Iniciando inyección de 'Alumnosfuga' (Cartera 2024)...")
    
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        archivos = [f for f in os.listdir(PATH_2024) if f.endswith('.csv')]
        total_procesados = 0
        nuevos_inyectados = 0

        for archivo in archivos:
            filepath = os.path.join(PATH_2024, archivo)
            print(f"📄 Procesando {archivo}...")
            
            with open(filepath, mode='r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile, delimiter=';')
                
                for row in reader:
                    nombre = row.get('Cliente:', '').strip()
                    email = row.get('Email:', '').strip().lower()
                    
                    if not email or '@' not in email:
                        continue

                    # Inyectar o Actualizar usando 'sede_habitual'
                    cur.execute("""
                        INSERT INTO socios (nombre, email, estado, segmento_riesgo, sede_habitual)
                        VALUES (%s, %s, 'Inactivo', 'Alumnosfuga', 'Campanario')
                        ON CONFLICT (email) 
                        DO UPDATE SET 
                            segmento_riesgo = EXCLUDED.segmento_riesgo,
                            updated_at = NOW()
                        WHERE socios.estado != 'Recuperado';
                    """, (nombre, email))
                    
                    if cur.rowcount > 0:
                        nuevos_inyectados += 1
                    
                    total_procesados += 1

        conn.commit()
        cur.close()
        conn.close()
        
        print(f"✅ Inyección completada con éxito.")
        print(f"📊 Total leídos: {total_procesados}")
        print(f"✨ Registros marcados como 'Alumnosfuga': {nuevos_inyectados}")

    except Exception as e:
        print(f"❌ Error durante la inyección: {e}")

if __name__ == "__main__":
    inyectar_fuga()
