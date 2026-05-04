import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
cur = conn.cursor()

print("=== DISTRIBUCION FINAL POR SEDE Y SEGMENTO ===")
cur.execute("""
    SELECT sede_habitual, segmento_riesgo, COUNT(*)
    FROM socios
    GROUP BY sede_habitual, segmento_riesgo
    ORDER BY sede_habitual, 
        CASE segmento_riesgo 
            WHEN 'Verde' THEN 1 WHEN 'Amarillo' THEN 2 
            WHEN 'Rojo' THEN 3 WHEN 'Critico' THEN 4 
            WHEN 'Antiguo' THEN 5 ELSE 6 END
""")
for r in cur.fetchall():
    print(f"Sede: {r[0]:<15} | Segmento: {r[1]:<12} | Count: {r[2]}")

conn.close()
