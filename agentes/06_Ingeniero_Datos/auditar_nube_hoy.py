import pandas as pd
from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway')

def auditar_madrugada():
    print("--- REPORTE DE AUTONOMIA (13/04/2026) ---")
    try:
        with engine.connect() as conn:
            # BoxMagic
            res_bm = conn.execute(text("SELECT COUNT(*), COALESCE(SUM(monto),0) FROM boxmagic_sales")).fetchone()
            print(f"BoxMagic en Nube: {res_bm[0]} registros (${res_bm[1]:,.0f} total)")
            
            # Lioren Compras
            res_fac = conn.execute(text("SELECT COUNT(*) FROM \"FacturaCompra\"")).fetchone()
            print(f"Facturas Compra: {res_fac[0]} registros")
            
            # Lioren Ventas
            res_ven = conn.execute(text("SELECT COUNT(*) FROM \"VentaOficial\"")).fetchone()
            print(f"Boletas Lioren (VentaOficial): {res_ven[0]} registros")
            
    except Exception as e:
        print(f"Error consultando Railway: {e}")


if __name__ == "__main__":
    auditar_madrugada()
