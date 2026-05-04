import os
import sys
import psycopg2
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

load_dotenv()
conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
cur = conn.cursor()

print("=== CIRUGIA DE DATOS - NIVEL CRITICO ===\n")

# OPERACION 1: Recalcular segmento_riesgo de TODOS los registros con la formula correcta
print("[OP1] Recalculando segmento_riesgo en toda la tabla socios...")
cur.execute("""
    UPDATE socios SET
        dias_inactivo = GREATEST(0, (CURRENT_DATE - fecha_ultimo_pago::date)),
        segmento_riesgo = CASE
            WHEN (CURRENT_DATE - fecha_ultimo_pago::date) < 30  THEN 'Verde'
            WHEN (CURRENT_DATE - fecha_ultimo_pago::date) < 60  THEN 'Amarillo'
            WHEN (CURRENT_DATE - fecha_ultimo_pago::date) < 180 THEN 'Rojo'
            WHEN (CURRENT_DATE - fecha_ultimo_pago::date) < 365 THEN 'Critico'
            ELSE 'Antiguo'
        END,
        estado = CASE
            WHEN (CURRENT_DATE - fecha_ultimo_pago::date) >= 30 THEN 'Inactivo'
            ELSE 'Activo'
        END
    WHERE fecha_ultimo_pago IS NOT NULL
""")
rows_updated = cur.rowcount
conn.commit()
print(f"   -> {rows_updated} registros recalculados\n")

# OPERACION 2: Verificar resultado de Patricia y Sebastian
print("[OP2] Verificando casos Patricia y Sebastian...")
cur.execute("""
    SELECT nombre, email, sede_habitual, segmento_riesgo, dias_inactivo, fecha_ultimo_pago
    FROM socios
    WHERE email IN ('lobospattyver959@gmail.com', 'ormenosormeno01@gmail.com')
       OR nombre ILIKE '%patricia%' OR nombre ILIKE '%sebastian%'
    ORDER BY dias_inactivo DESC
    LIMIT 10
""")
for r in cur.fetchall():
    print(f"   {r[0]} | {r[2]} | {r[3]} | {r[4]} dias | {r[5]}")

# OPERACION 3: Auditoria final - verificar que Critico solo tenga rango 180-364 dias
print("\n[OP3] Auditoria final de Criticos...")
cur.execute("""
    SELECT 
        nombre, email, sede_habitual, segmento_riesgo, dias_inactivo, fecha_ultimo_pago
    FROM socios
    WHERE segmento_riesgo = 'Critico'
    ORDER BY sede_habitual, dias_inactivo
""")
rows = cur.fetchall()
print(f"   Total Criticos: {len(rows)}")
for r in rows:
    rango_ok = "OK" if 180 <= (r[4] or 0) < 365 else "FUERA DE RANGO"
    print(f"   [{rango_ok}] {r[0]} | sede={r[2]} | {r[4]} dias | pago={r[5]}")

# OPERACION 4: Distribucion final limpia
print("\n[OP4] Distribucion final por Sede y Segmento:")
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
print(f"   {'Sede':<15} {'Segmento':<12} {'Count':>6}")
print(f"   {'-'*35}")
for r in cur.fetchall():
    print(f"   {str(r[0]):<15} {str(r[1]):<12} {str(r[2]):>6}")

conn.close()
print("\n=== CIRUGIA COMPLETADA ===")
