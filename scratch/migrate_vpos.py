import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.getenv('DATABASE_URL')

def migrate():
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        cur.execute("ALTER TABLE socios ADD COLUMN IF NOT EXISTS vpos_uuid TEXT;")
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Columna vpos_uuid añadida exitosamente.")
    except Exception as e:
        print(f"❌ Error en migración: {e}")

if __name__ == "__main__":
    migrate()
