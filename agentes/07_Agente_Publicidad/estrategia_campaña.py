import os
import sys
import psycopg2
from dotenv import load_dotenv

# Forzar codificación UTF-8 para evitar errores con emojis en Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()
conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
cur = conn.cursor()

def generar_propuesta_campaña():
    print("="*60)
    print("🚀 ANALISIS DE CAMPAÑA POR AGENTE MAGNUS")
    print("="*60)
    
    # 1. Analizar potenciales de recuperación
    cur.execute("""
        SELECT sede_habitual, segmento_riesgo, COUNT(*), SUM(monto_promedio)
        FROM socios
        WHERE estado = 'Inactivo'
        GROUP BY sede_habitual, segmento_riesgo
        ORDER BY sede_habitual, segmento_riesgo
    """)
    stats = cur.fetchall()
    
    print("\n[STEP 1] OPORTUNIDADES POR SEDE:")
    for s in stats:
        print(f"   Sede: {s[0]:<15} | Segmento: {s[1]:<10} | Alumnos: {s[2]:>3} | Potencial: ${s[3]:,}")

    # 2. Generar Copywriting Sugerido
    print("\n[STEP 2] COPYWRITING ESTRATEGICO (Metodo AIDA):")
    
    copy_whatsapp = """
    🥊 *¡EL REGRESO DEL CAMPEÓN!* 🥊
    
    Hola [Nombre], soy Magnus de *The Boos Box*. 
    
    He visto que hace tiempo que no te pones los guantes con nosotros y ¡te extrañamos en el ring! Sabemos que volver cuesta, por eso te lo vamos a poner MUY fácil:
    
    🔥 *PROMO RESCATE:* 4 Clases por solo **$19.000**.
    (Sin matrícula, sin contratos, solo tú y el saco).
    
    ¿Te reservo un lugar para esta semana en [Sede]? 
    ¡Quedan solo 5 cupos para esta promo!
    """
    
    print("-" * 30)
    print("📱 PARA WHATSAPP / INSTAGRAM DM:")
    print(copy_whatsapp)
    print("-" * 30)

    # 3. Sugerencia de Presupuesto
    print("\n[STEP 3] PLAN DE MEDIOS (META ADS):")
    print("   Target: Alumnos Antiguos y Críticos (Custom Audience)")
    print("   Presupuesto Sugerido: $50.000 (10 días)")
    print("   Objetivo: 20 Reactivaciones")
    print("   CPA Estimado: $2.500 por alumno")

    conn.close()

if __name__ == "__main__":
    generar_propuesta_campaña()
