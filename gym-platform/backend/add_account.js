const { Pool } = require('pg');
const pool = new Pool({ 
    connectionString: 'postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway', 
    ssl: { rejectUnauthorized: false } 
});

async function add() {
    try {
        await pool.query('INSERT INTO "CuentaContable" (id, nombre, tipo) VALUES (gen_random_uuid(), $1, $2)', 
            ['Planificacion Profesores', 'Egreso']
        );
        console.log("✅ CUENTA DISPONIBLE: Planificacion Profesores");
    } catch (e) {
        console.error("❌ ERROR:", e.message);
    } finally {
        await pool.end();
    }
}
add();
