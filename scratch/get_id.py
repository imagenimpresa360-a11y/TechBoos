import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.getenv('DATABASE_URL')

def get_sample():
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        cur.execute("SELECT id, nombre FROM socios WHERE email IS NOT NULL LIMIT 1;")
        row = cur.fetchone()
        if row:
            print(f"ID: {row[0]}")
            print(f"Nombre: {row[1]}")
        else:
            print("No se encontraron socios.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_sample()
