process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway",
  ssl: { rejectUnauthorized: false }
});

async function setup() {
  try {
    console.log("Iniciando creación de tabla cola_emails...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cola_emails (
          id SERIAL PRIMARY KEY,
          socio_id UUID, 
          tipo_campana TEXT DEFAULT 'Rescate 27k',
          estado TEXT DEFAULT 'Pendiente',
          fecha_creacion TIMESTAMP DEFAULT NOW(),
          fecha_envio_programado TIMESTAMP,
          error_log TEXT
      );
    `);
    console.log("✅ Tabla cola_emails creada exitosamente.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

setup();
