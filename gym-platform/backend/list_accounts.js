const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway', ssl: { rejectUnauthorized: false } });

async function listAccounts() {
    try {
        const res = await pool.query('SELECT nombre, tipo FROM "CuentaContable"');
        console.log("--- PLAN DE CUENTAS ACTUAL EN RAILWAY ---");
        res.rows.forEach(r => console.log(`[${r.tipo}] - ${r.nombre}`));
    } catch (e) {
        console.error(e.message);
    } finally {
        await pool.end();
    }
}
listAccounts();
