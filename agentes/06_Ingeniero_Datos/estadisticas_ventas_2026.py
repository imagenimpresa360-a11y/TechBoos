import psycopg2
import pandas as pd

# CONFIG
DB_URL = "postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway"

def calculate_stats():
    try:
        conn = psycopg2.connect(DB_URL)
        # Query all sales for 2026
        # Note: 'mes' is stored as string like 'enero', 'febrero', etc.
        query = "SELECT sede, tipo_pago, monto FROM boxmagic_sales"
        df = pd.read_sql(query, conn)
        conn.close()
        
        if df.empty:
            print("No data found in boxmagic_sales.")
            return

        # Normalize payment types
        # Card: webpay, transbank, tarjeta (case insensitive)
        # Transfer: transferencia
        
        def categorizar(tipo):
            tipo = str(tipo).lower()
            if any(x in tipo for x in ['webpay', 'transbank', 'tarjeta']):
                return 'Tarjeta (Crédito/Débito)'
            if 'transferencia' in tipo:
                return 'Transferencia'
            if 'efectivo' in tipo:
                return 'Efectivo'
            return 'Otro'

        df['Categoria'] = df['tipo_pago'].apply(categorizar)
        
        # Calculate by Sede
        print("="*60)
        print("ESTADÍSTICAS DE VENTAS 2026 (ACUMULADO)")
        print("="*60)
        
        sedes = df['sede'].unique()
        for sede in sedes:
            sede_df = df[df['sede'] == sede]
            total_sede = sede_df['monto'].sum()
            print(f"\nSEDE: {sede.upper()}")
            print(f"Total Recaudado: ${total_sede:,.0f}".replace(',', '.'))
            
            stats = sede_df.groupby('Categoria')['monto'].sum() / total_sede * 100
            for cat, pct in stats.items():
                monto_cat = sede_df[sede_df['Categoria'] == cat]['monto'].sum()
                print(f"- {cat:25s}: {pct:6.1f}% (${monto_cat:,.0f})".replace(',', '.'))
        
        # Global Total
        print("\n" + "="*60)
        print("TOTAL CONSOLIDADO (AMBAS SEDES)")
        total_global = df['monto'].sum()
        stats_global = df.groupby('Categoria')['monto'].sum() / total_global * 100
        for cat, pct in stats_global.items():
            monto_cat = df[df['Categoria'] == cat]['monto'].sum()
            print(f"- {cat:25s}: {pct:6.1f}% (${monto_cat:,.0f})".replace(',', '.'))
        print("="*60)

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    calculate_stats()
