import os
import psycopg2
from dotenv import load_dotenv
import re

load_dotenv()

def deducir_sede(plan_texto, sede_default):
    if not plan_texto: return sede_default
    p = str(plan_texto).upper()
    # Identificadores de Marina (M)
    if any(x in p for x in ['MARINA', ' CF M', '/CF M', ' M ', ' 12M', ' 8M', ' 4M', ' SENIOR M']):
        return 'Marina'
    # Identificadores de Campanario (C)
    if any(x in p for x in ['CAMPANARIO', ' CF C', '/CF C', ' C ', ' 12C', ' 8C', ' 4C', ' SENIOR C']):
        return 'Campanario'
    return sede_default

conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
cur = conn.cursor()

print("--- Iniciando Re-clasificación de Sedes ---")
cur.execute("SELECT id, nombre, email, plan_ultimo, sede_habitual FROM socios")
rows = cur.fetchall()

actualizados = 0
for r_id, nombre, email, plan, sede_actual in rows:
    sede_nueva = deducir_sede(plan, 'Desconocida')
    
    # Si logramos deducir algo que no es Desconocido y es distinto a lo actual
    if sede_nueva != 'Desconocida' and sede_nueva != sede_actual:
        cur.execute("UPDATE socios SET sede_habitual = %s WHERE id = %s", (sede_nueva, r_id))
        actualizados += 1
        print(f"[FIX] {nombre} ({email}): {sede_actual} -> {sede_nueva} | Plan: {plan}")

conn.commit()
print(f"\n[OK] Se actualizaron {actualizados} socios.")

# Mostrar nuevos conteos
cur.execute('SELECT sede_habitual, segmento_riesgo, COUNT(*) FROM socios GROUP BY sede_habitual, segmento_riesgo ORDER BY sede_habitual, segmento_riesgo')
print("\n--- Nuevos Conteos ---")
for r in cur.fetchall():
    print(r)

conn.close()
