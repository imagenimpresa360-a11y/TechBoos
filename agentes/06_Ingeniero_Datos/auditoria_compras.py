import os, psycopg2
from dotenv import load_dotenv

# Cargar configuración desde el backend de Boos
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../gym-platform/backend/.env'))
DATABASE_URL = os.getenv("DATABASE_URL")

def auditoria_meses():
    try:
        # Limpiar parámetros de query que psycopg2 no entiende bien
        db_url = DATABASE_URL.split('?')[0] if DATABASE_URL else None
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Primero, descubrir el nombre correcto de la tabla
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        tablas = [t[0] for t in cur.fetchall()]
        
        tabla_compras = "FacturaCompra" # Nombre por defecto
        if "FacturaCompra" not in tablas:
            # Buscamos variantes ignorando mayusculas
            posibles = [t for t in tablas if "comp" in t.lower() or "fact" in t.lower()]
            if posibles: tabla_compras = posibles[0]
            else: 
                print(f"No encontré tabla de compras. Tablas activas: {tablas}")
                return

        print(f"\n--- REPORTE DE INYECCIONES LIOREN (Tabla: {tabla_compras}) ---")
        
        # Descubrir columnas (respetando mayúsculas)
        cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{tabla_compras}'")
        cols = [c[0] for c in cur.fetchall()]
        
        # Buscar el mejor candidato para la fecha
        col_fecha = "fecha"
        for c in cols:
            if c.lower() in ["fecha", "date", "createdat", "updatedat"]:
                col_fecha = c
                break
        else:
            # Fallback a lo que se parezca
            posibles_f = [c for c in cols if "date" in c.lower() or "fecha" in c.lower()]
            if posibles_f: col_fecha = posibles_f[0]

        cur.execute(f"SELECT TO_CHAR(\"{col_fecha}\", 'YYYY-MM') as mes, COUNT(*) FROM \"{tabla_compras}\" GROUP BY mes ORDER BY mes DESC")
        rows = cur.fetchall()
        
        if not rows:
            print("No se encontraron registros en la tabla de compras.")
        else:
            for r in rows:
                print(f"Mes: {r[0]} | Facturas/Boletas Inyectadas: {r[1]}")
                
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error consultando DB: {e}")

if __name__ == "__main__":
    auditoria_meses()
