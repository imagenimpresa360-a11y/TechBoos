const { Pool } = require('pg');
const pool = new Pool({ 
    connectionString: 'postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway', 
    ssl: { rejectUnauthorized: false } 
});

async function setup() {
    try {
        console.log("🛠️  Agregando infraestructura para Libro de Ventas...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "VentaOficial" (
                id UUID PRIMARY KEY, 
                folio TEXT, 
                fecha TEXT, 
                monto INT, 
                tipo TEXT, 
                "updatedAt" TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log("✅ TABLA VentaOficial CREADA EXITOSAMENTE");
    } catch (e) {
        console.error("❌ ERROR:", e.message);
    } finally {
        await pool.end();
    }
}

setup();
