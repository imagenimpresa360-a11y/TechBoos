import psycopg2
import pandas as pd

DB_URL = "postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway"

def check_months():
    try:
        conn = psycopg2.connect(DB_URL)
        query = "SELECT sede, mes, COUNT(*) as registros FROM boxmagic_sales GROUP BY sede, mes ORDER BY sede, mes"
        df = pd.read_sql(query, conn)
        conn.close()
        print(df.to_string())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_months()
