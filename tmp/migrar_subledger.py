"""
MIGRACIÓN ADITIVA — SUB-LEDGER POR SEDE
Escenario B (SAP/Oracle Style)
NO borra ninguna tabla ni fila existente.
Solo agrega tablas y columnas nuevas.
"""
import psycopg2

DB_URL = "postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway"

conn = psycopg2.connect(DB_URL, sslmode='require')
cur = conn.cursor()
print("Conexion exitosa a Railway.")

# ────────────────────────────────────────────
# 1. CATALOGO DE SEDES (tabla nueva)
# ────────────────────────────────────────────
cur.execute("""
CREATE TABLE IF NOT EXISTS sedes (
    id         VARCHAR(10) PRIMARY KEY,
    nombre     VARCHAR(50) NOT NULL,
    activa     BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
""")
cur.execute("""
INSERT INTO sedes (id, nombre) VALUES 
    ('1385', 'Campanario'),
    ('1077', 'Marina')
ON CONFLICT DO NOTHING;
""")
print("OK - Tabla sedes creada y poblada.")

# ────────────────────────────────────────────
# 2. AMPLIAR boxmagic_sales (SIN BORRAR NADA)
# ────────────────────────────────────────────
nuevas_cols_boxmagic = [
    "ALTER TABLE boxmagic_sales ADD COLUMN IF NOT EXISTS email VARCHAR(200)",
    "ALTER TABLE boxmagic_sales ADD COLUMN IF NOT EXISTS plan VARCHAR(100)",
    "ALTER TABLE boxmagic_sales ADD COLUMN IF NOT EXISTS estado_pago VARCHAR(50)",
    "ALTER TABLE boxmagic_sales ADD COLUMN IF NOT EXISTS tipo_banco VARCHAR(20) DEFAULT NULL",
    "ALTER TABLE boxmagic_sales ADD COLUMN IF NOT EXISTS estado_conciliacion VARCHAR(20) DEFAULT 'PENDIENTE'",
    "ALTER TABLE boxmagic_sales ADD COLUMN IF NOT EXISTS bci_pool_id VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE boxmagic_sales ADD COLUMN IF NOT EXISTS fecha_conciliacion TIMESTAMP DEFAULT NULL",
]
for sql in nuevas_cols_boxmagic:
    cur.execute(sql)
print("OK - boxmagic_sales ampliada.")

# ────────────────────────────────────────────
# 3. AMPLIAR bci_income_pool (SIN BORRAR NADA)
# ────────────────────────────────────────────
nuevas_cols_bci = [
    "ALTER TABLE bci_income_pool ADD COLUMN IF NOT EXISTS sede_atribuida VARCHAR(50) DEFAULT NULL",
    "ALTER TABLE bci_income_pool ADD COLUMN IF NOT EXISTS tipo_movimiento VARCHAR(20) DEFAULT NULL",
    "ALTER TABLE bci_income_pool ADD COLUMN IF NOT EXISTS conciliado_por VARCHAR(20) DEFAULT NULL",
]
for sql in nuevas_cols_bci:
    cur.execute(sql)
print("OK - bci_income_pool ampliada.")

# ────────────────────────────────────────────
# 4. AMPLIAR daily_reconciliation (SIN BORRAR)
# ────────────────────────────────────────────
nuevas_cols_recon = [
    "ALTER TABLE daily_reconciliation ADD COLUMN IF NOT EXISTS sede VARCHAR(50) DEFAULT NULL",
    "ALTER TABLE daily_reconciliation ADD COLUMN IF NOT EXISTS tipo_ingreso VARCHAR(20) DEFAULT NULL",
    "ALTER TABLE daily_reconciliation ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()",
]
for sql in nuevas_cols_recon:
    cur.execute(sql)
print("OK - daily_reconciliation ampliada.")

conn.commit()
print("\n========== MIGRACION COMPLETADA ==========")

# ── VERIFICACIÓN FINAL ──────────────────────
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
tablas = [r[0] for r in cur.fetchall()]
print("TABLAS EN RAILWAY:", tablas)

cur.execute("SELECT id, nombre FROM sedes ORDER BY id")
print("SEDES:", cur.fetchall())

cur.execute("""
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name='boxmagic_sales' 
    ORDER BY ordinal_position
""")
print("\nCOLUMNAS boxmagic_sales:")
for r in cur.fetchall():
    print(f"  {r[0]:30s} {r[1]}")

cur.execute("""
    SELECT column_name FROM information_schema.columns 
    WHERE table_name='bci_income_pool' ORDER BY ordinal_position
""")
print("\nCOLUMNAS bci_income_pool:", [r[0] for r in cur.fetchall()])

cur.close()
conn.close()
print("\nConexion cerrada. Sin errores.")
