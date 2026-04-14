from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway')

def check_structure():
    with engine.connect() as conn:
        print("--- COLUMNAS TABLA Egreso ---")
        res = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Egreso'"))
        for r in res:
            print(f"- {r[0]} ({r[1]})")

if __name__ == "__main__":
    check_structure()
