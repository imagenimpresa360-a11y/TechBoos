const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: "postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway"
});

async function migrate() {
  console.log("--- INICIANDO MIGRACIÓN BANCO BCI (DATA DE ORO) ---");
  try {
    const query = `
      ALTER TABLE bci_income_pool 
      ADD COLUMN IF NOT EXISTS nombre_remitente VARCHAR(255),
      ADD COLUMN IF NOT EXISTS rut_remitente VARCHAR(20),
      ADD COLUMN IF NOT EXISTS glosa VARCHAR(255);
    `;
    await pool.query(query);
    console.log("✅ Columnas (nombre_remitente, rut_remitente, glosa) añadidas exitosamente.");
  } catch (err) {
    console.error("❌ Error en la migración del banco:", err);
  } finally {
    await pool.end();
  }
}

migrate();
