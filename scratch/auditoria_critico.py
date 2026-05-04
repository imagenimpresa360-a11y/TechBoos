import os
import sys
import psycopg2
from dotenv import load_dotenv
from datetime import date

# Forzar salida UTF-8
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

load_dotenv()
conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
cur = conn.cursor()

hoy = date.today()
print(f"=== FECHA HOY: {hoy} ===")
print(f"RANGO CRITICO: entre 180 y 364 dias de inactividad")
print(f"  Corte inferior (Critico->Antiguo): antes de {hoy.replace(year=hoy.year-1).isoformat()}")
print(f"  Corte superior (Rojo->Critico):   antes de 2025-11-05")
print()

cur.execute("""
    SELECT 
        nombre, email, sede_habitual, plan_ultimo,
        fecha_ultimo_pago,
        (CURRENT_DATE - fecha_ultimo_pago::date) AS dias_calc,
        segmento_riesgo
    FROM socios
    WHERE segmento_riesgo = 'Critico'
    ORDER BY sede_habitual, fecha_ultimo_pago DESC
""")
rows = cur.fetchall()

print(f"=== TOTAL CRITICOS EN DB: {len(rows)} ===\n")
for r in rows:
    nombre, email, sede, plan, fecha, dias, seg = r
    ok = "OK" if 180 <= dias < 365 else "FUERA DE RANGO"
    print(f"  [{ok}] {nombre} | {sede}")
    print(f"         Email: {email}")
    print(f"         Plan:  {plan}")
    print(f"         Ultimo pago: {fecha}  -> {dias} dias inactivo")
    print()

print("=== DISTRIBUCION COMPLETA POR SEDE Y SEGMENTO ===")
cur.execute("""
    SELECT 
        sede_habitual,
        segmento_riesgo,
        COUNT(*),
        MIN(fecha_ultimo_pago) as fecha_mas_antigua,
        MAX(fecha_ultimo_pago) as fecha_mas_reciente,
        MIN(CURRENT_DATE - fecha_ultimo_pago::date) as min_dias,
        MAX(CURRENT_DATE - fecha_ultimo_pago::date) as max_dias
    FROM socios
    WHERE fecha_ultimo_pago IS NOT NULL
    GROUP BY sede_habitual, segmento_riesgo
    ORDER BY sede_habitual, 
        CASE segmento_riesgo 
            WHEN 'Verde' THEN 1 WHEN 'Amarillo' THEN 2 
            WHEN 'Rojo' THEN 3 WHEN 'Critico' THEN 4 
            WHEN 'Antiguo' THEN 5 ELSE 6 END
""")
print(f"{'Sede':<15} {'Segmento':<12} {'N':>5} {'FechaMin':>12} {'FechaMax':>12} {'DiasMin':>8} {'DiasMax':>8}")
print("-"*80)
for r in cur.fetchall():
    print(f"{str(r[0]):<15} {str(r[1]):<12} {str(r[2]):>5} {str(r[3]):>12} {str(r[4]):>12} {str(r[5]):>8} {str(r[6]):>8}")

conn.close()
