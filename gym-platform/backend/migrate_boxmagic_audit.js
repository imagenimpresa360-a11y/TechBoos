const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: "postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway"
});

async function migrate() {
  console.log("--- INICIANDO MIGRACIÓN AUDITORÍA BOXMAGIC ---");
  try {
    const query = `
      ALTER TABLE boxmagic_sales 
      ADD COLUMN IF NOT EXISTS plan VARCHAR(255),
      ADD COLUMN IF NOT EXISTS estado_auditoria VARCHAR(50) DEFAULT 'Pendiente',
      ADD COLUMN IF NOT EXISTS comentario_auditoria TEXT,
      ADD COLUMN IF NOT EXISTS metodo_pago_corregido VARCHAR(50);
    `;
    await pool.query(query);
    console.log("✅ Columnas añadidas exitosamente a la tabla boxmagic_sales.");
  } catch (err) {
    console.error("❌ Error en la migración:", err);
  } finally {
    await pool.end();
  }
}

migrate();
