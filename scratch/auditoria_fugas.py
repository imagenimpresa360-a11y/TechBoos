import os
import psycopg2
import sys
from dotenv import load_dotenv

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

def auditoria():
    try:
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        cur = conn.cursor()
        cur.execute("SELECT segmento_riesgo, COUNT(*) FROM socios GROUP BY segmento_riesgo")
        results = cur.fetchall()
        print("📊 Conteo por Segmento en BD:")
        for res in results:
            print(f"- {res[0]}: {res[1]}")
        
        # Verificar si hay alumnos 2024
        cur.execute("SELECT COUNT(*) FROM socios WHERE segmento_riesgo = 'Alumnosfuga'")
        fugas = cur.fetchone()[0]
        print(f"\n🔍 Total Alumnosfuga: {fugas}")
        
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    auditoria()
