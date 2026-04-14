from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway')

def update_schema():
    with engine.connect() as conn:
        print("Añadiendo columna 'fecha' a la tabla Egreso...")
        conn.execute(text('ALTER TABLE "Egreso" ADD COLUMN IF NOT EXISTS fecha TEXT;'))
        conn.commit()
        print("Esquema actualizado correctamente.")

if __name__ == "__main__":
    update_schema()
