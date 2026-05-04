import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
cur = conn.cursor()

cur.execute("SELECT nombre, email, segmento_riesgo, dias_inactivo FROM socios WHERE nombre ILIKE '%Palomera%'")
print("Palomera:", cur.fetchone())

print("\n--- Conteos Finales ---")
cur.execute('SELECT segmento_riesgo, COUNT(*) FROM socios GROUP BY segmento_riesgo')
for r in cur.fetchall():
    print(r)

conn.close()
