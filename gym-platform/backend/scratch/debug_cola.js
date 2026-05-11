process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway',
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        // Ver columnas reales de la tabla cola_emails
        const cols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'cola_emails'
            ORDER BY ordinal_position
        `);
        console.log('Columnas reales de cola_emails:');
        cols.rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type})`));

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        pool.end();
    }
}
main();
