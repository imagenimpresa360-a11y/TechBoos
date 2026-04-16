import psycopg2

conn_str = 'postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway'
try:
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    cur.execute("UPDATE boxmagic_sales SET mes = 'abril' WHERE mes ILIKE 'april' OR mes ILIKE 'abril'")
    print(f"Updated {cur.rowcount} rows to 'abril'")
    conn.commit()
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
