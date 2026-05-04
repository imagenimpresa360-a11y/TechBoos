import os
import sys
import psycopg2
from dotenv import load_dotenv
from datetime import date, timedelta

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

load_dotenv()
conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
cur = conn.cursor()

hoy = date.today()
# Nuevo umbral: "Antiguo" solo para pagos ANTES del 01-Enero-2025
CORTE_ANTIGUO = date(2025, 1, 1)
dias_corte_antiguo = (hoy - CORTE_ANTIGUO).days  # ~489 días

print("="*60)
print("CIRUGIA DE DATOS - REDEFINICION COMPLETA DE SEGMENTOS")
print("="*60)
print(f"Hoy: {hoy}")
print(f"Nueva logica:")
print(f"  Verde:    < 30 dias  (pago desde {hoy - timedelta(30)})")
print(f"  Amarillo: 30-59 dias (pago desde {hoy - timedelta(60)} a {hoy - timedelta(30)})")
print(f"  Rojo:     60-179 dias")
print(f"  Critico:  180 a {dias_corte_antiguo-1} dias  (desde 01-Ene-2025)")
print(f"  Antiguo:  {dias_corte_antiguo}+ dias (antes del 01-Ene-2025)")
print()

# OP1: Actualizar segmentos con nueva lógica
print("[OP1] Aplicando nueva segmentacion...")
cur.execute(f"""
    UPDATE socios SET
        dias_inactivo = GREATEST(0, (CURRENT_DATE - fecha_ultimo_pago::date)),
        segmento_riesgo = CASE
            WHEN (CURRENT_DATE - fecha_ultimo_pago::date) < 30  THEN 'Verde'
            WHEN (CURRENT_DATE - fecha_ultimo_pago::date) < 60  THEN 'Amarillo'
            WHEN (CURRENT_DATE - fecha_ultimo_pago::date) < 180 THEN 'Rojo'
            WHEN fecha_ultimo_pago >= '2025-01-01'               THEN 'Critico'
            ELSE 'Antiguo'
        END,
        estado = CASE
            WHEN (CURRENT_DATE - fecha_ultimo_pago::date) >= 30 THEN 'Inactivo'
            ELSE 'Activo'
        END
    WHERE fecha_ultimo_pago IS NOT NULL
""")
conn.commit()
print(f"   -> {cur.rowcount} registros actualizados\n")

# OP2: Asignar sedes a los registros Desconocida conocidos
print("[OP2] Asignando sedes a registros conocidos...")
asignaciones = [
    # (email, sede_correcta, razon)
    # Seba, Vladimir, Camilo -> asistian a ambas sedes, se dejan como Desconocida pero con nota
    ('martinezsebastian.martinezav@gmail.com', 'Desconocida', 'Ambas sedes (instructor/socio ambas)'),
    ('avladimir.palma.m@gmail.com',            'Desconocida', 'Ambas sedes (instructor/socio ambas)'),
    ('medinacaamilo.m@live.cl',                'Desconocida', 'Ambas sedes (instructor/socio ambas)'),
    # Resto -> Marina
    ('pardonsierrap@uft.edu',                  'Marina', 'Confirmado Marina por usuario'),
    ('urbinaaurbina.kine@gmail.com',           'Marina', 'Confirmado Marina por usuario'),
    ('baezameza.benja@gmail.com',              'Marina', 'Confirmado Marina por usuario'),
    ('beatrizcelu@gmail.com',                  'Marina', 'Confirmado Marina por usuario'),
    ('ragazzicony.ragazzi.g@gmail.com',        'Marina', 'Confirmado Marina por usuario'),
]

for email, sede, razon in asignaciones:
    cur.execute("UPDATE socios SET sede_habitual = %s WHERE email = %s", (sede, email))
    print(f"   [{sede}] {email} -> {razon}")

conn.commit()
print()

# OP3: Cross-match - Criticos vs activos en BoxMagic (CSV mas reciente = Abril 2026)
print("[OP3] CROSS-MATCH: Criticos vs alumnos activos recientes...")
# Alumnos activos = Verde o Amarillo (pagaron en los ultimos 60 dias)
cur.execute("""
    SELECT email FROM socios 
    WHERE segmento_riesgo IN ('Verde', 'Amarillo')
    AND fecha_ultimo_pago >= '2026-01-01'
""")
activos_emails = set(r[0] for r in cur.fetchall())
print(f"   Alumnos activos/recientes en DB: {len(activos_emails)}")

# Criticos de cada sede
for sede_filtro in ['Campanario', 'Marina', 'Desconocida']:
    cur.execute("""
        SELECT nombre, email, dias_inactivo, fecha_ultimo_pago, plan_ultimo
        FROM socios
        WHERE segmento_riesgo = 'Critico'
        AND sede_habitual = %s
        ORDER BY dias_inactivo ASC
    """, (sede_filtro,))
    criticos = cur.fetchall()
    
    reactivados = [r for r in criticos if r[1] in activos_emails]
    pendientes  = [r for r in criticos if r[1] not in activos_emails]
    
    print(f"\n  --- CRITICOS {sede_filtro.upper()} ({len(criticos)} total) ---")
    print(f"  Ya reactivados (match con activos): {len(reactivados)}")
    for r in reactivados:
        print(f"    [REACTIVADO] {r[0]} | {r[3]} | {r[4]}")
    print(f"  Por recuperar (sin match): {len(pendientes)}")
    for r in pendientes:
        print(f"    [PENDIENTE] {r[0]} | {r[3]} | {r[2]} dias | {r[4]}")

# OP4: Distribucion final
print("\n[OP4] DISTRIBUCION FINAL:")
cur.execute("""
    SELECT sede_habitual, segmento_riesgo, COUNT(*),
           MIN(fecha_ultimo_pago), MAX(fecha_ultimo_pago)
    FROM socios
    GROUP BY sede_habitual, segmento_riesgo
    ORDER BY sede_habitual,
        CASE segmento_riesgo 
            WHEN 'Verde' THEN 1 WHEN 'Amarillo' THEN 2 
            WHEN 'Rojo' THEN 3 WHEN 'Critico' THEN 4 
            WHEN 'Antiguo' THEN 5 ELSE 6 END
""")
print(f"   {'Sede':<15} {'Segmento':<12} {'N':>5} {'Desde':>12} {'Hasta':>12}")
print(f"   {'-'*60}")
for r in cur.fetchall():
    print(f"   {str(r[0]):<15} {str(r[1]):<12} {str(r[2]):>5} {str(r[3]):>12} {str(r[4]):>12}")

conn.close()
print("\n=== CIRUGIA COMPLETADA ===")
