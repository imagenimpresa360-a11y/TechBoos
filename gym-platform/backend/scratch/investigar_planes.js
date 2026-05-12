process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway',
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        // Buscar columnas de socios
        const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'socios'");
        console.log('Columnas de socios:', cols.rows.map(r => r.column_name).join(', '));

        // Buscar tablas relacionadas que puedan tener planes
        const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tablas en la BD:', tables.rows.map(r => r.table_name).join(', '));

        // Ver una muestra de la tabla que parece tener pagos/planes
        // Si existe 'pagos_boxmagic' o similar
        if (tables.rows.some(t => t.table_name === 'boxmagic_data')) {
            const sample = await pool.query("SELECT * FROM boxmagic_data LIMIT 1");
            console.log('Muestra boxmagic_data:', sample.rows[0]);
        }

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
main();
