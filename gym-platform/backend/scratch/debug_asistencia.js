process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway',
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        const res = await pool.query("SELECT * FROM asistencia_packs LIMIT 1");
        console.log('Fila de muestra asistencia_packs:', res.rows[0]);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
main();
