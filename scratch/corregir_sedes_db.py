import os
import psycopg2
from dotenv import load_dotenv
import csv
import xlrd

load_dotenv()
conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
cur = conn.cursor()

# =====================================================================
# PASO 1: Identificar emails que SOLO existen en el archivo global
# (no tienen registros en los CSV de sede específica)
# =====================================================================

# Recopilar todos los emails de fuentes confiables (CSVs por sede)
emails_sede_confiable = set()

base = r"c:\PROYECTO DEV\AG TBB\agentes\06_Ingeniero_Datos\boxmagic"
for sede_folder in ["campanario", "marina"]:
    folder = os.path.join(base, sede_folder)
    for fname in os.listdir(folder):
        if fname.endswith('.csv'):
            fpath = os.path.join(folder, fname)
            try:
                with open(fpath, 'r', encoding='utf-8-sig', errors='replace') as f:
                    reader = csv.reader(f)
                    raw_rows = list(reader)
                if not raw_rows: continue
                if len(raw_rows[0]) == 1 and ',' in raw_rows[0][0]:
                    cleaned = []
                    for r in raw_rows:
                        if r and r[0]:
                            inner = csv.reader([r[0]])
                            cleaned.append(next(inner))
                    raw_rows = cleaned
                for row in raw_rows[1:]:
                    try:
                        email = row[2].lower().strip()
                        if '@' in email:
                            emails_sede_confiable.add(email)
                    except: pass
            except: pass

print(f"[INFO] Emails con fuente confiable de sede: {len(emails_sede_confiable)}")

# Ahora corregir en la DB:
# Si un registro tiene una sede asignada pero su email NO aparece en ninguna 
# fuente confiable, entonces la sede es sospechosa → forzar 'Desconocida'
cur.execute("SELECT id, email, sede_habitual, plan_ultimo FROM socios")
rows = cur.fetchall()

corregidos = 0
for row_id, email, sede, plan in rows:
    if email not in emails_sede_confiable:
        # Este socio SOLO vino del archivo global
        # Asignarle Desconocida salvo que el plan indique claramente la sede
        plan_upper = (plan or '').upper()
        if any(x in plan_upper for x in ['MARINA', ' CF M', '/CF M', ' M ', ' 12M', ' 8M', ' 4M', ' SENIOR M']):
            sede_correcta = 'Marina'
        elif any(x in plan_upper for x in ['CAMPANARIO', ' CF C', '/CF C', ' C ', ' 12C', ' 8C', ' 4C', ' SENIOR C']):
            sede_correcta = 'Campanario'
        else:
            sede_correcta = 'Desconocida'
        
        if sede != sede_correcta:
            cur.execute("UPDATE socios SET sede_habitual = %s WHERE id = %s", (sede_correcta, row_id))
            print(f"[FIX] {email}: {sede} -> {sede_correcta} | Plan: {plan}")
            corregidos += 1

conn.commit()
print(f"\n[OK] {corregidos} registros corregidos")

# Verificación final
print("\n=== VERIFICACIÓN POST-CORRECCIÓN ===")
cur.execute("""
    SELECT nombre, email, sede_habitual FROM socios 
    WHERE email ILIKE '%pardonsierrap%'
""")
print("Nicolas Sierra:", cur.fetchone())

print("\n=== Conteos finales ===")
cur.execute('SELECT sede_habitual, segmento_riesgo, COUNT(*) FROM socios GROUP BY sede_habitual, segmento_riesgo ORDER BY sede_habitual, segmento_riesgo')
for r in cur.fetchall():
    print(r)

conn.close()
