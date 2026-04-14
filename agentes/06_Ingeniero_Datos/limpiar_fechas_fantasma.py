from sqlalchemy import create_engine, text
from datetime import datetime

engine = create_engine('postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway')

def limpiar_fechas_fantasma():
    with engine.connect() as conn:
        print("Buscando movimientos con fechas imposibles en el pool de conciliacion...")
        # Eliminamos cualquier fecha que sea superior a hoy + 7 dias (por aquello de los feriados/adelantos bancarios)
        # Hoy es 13 de Abril de 2026.
        query = text("""
            DELETE FROM bci_income_pool 
            WHERE fecha_banco > '2026-04-20' 
               OR fecha_banco < '2024-01-01';
        """)
        res = conn.execute(query)
        conn.commit()
        print(f"Limpieza de BCI completa. Se eliminaron {res.rowcount} registros con fechas corruptas.")

if __name__ == "__main__":
    limpiar_fechas_fantasma()
