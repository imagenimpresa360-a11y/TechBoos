from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway')

def auditar_pool():
    with engine.connect() as conn:
        print("--- TOP 15 MOVIMIENTOS PENDIENTES (ORDENADOS POR FECHA) ---")
        query = text("""
            SELECT fecha_banco, monto, nombre_banco 
            FROM bci_income_pool 
            WHERE estado_match = 'PENDIENTE' 
            ORDER BY fecha_banco DESC 
            LIMIT 15
        """)
        res = conn.execute(query)
        for r in res:
            print(f"- {r[0]}: ${r[1]:,.0f} | {r[2]}")

if __name__ == "__main__":
    auditar_pool()
