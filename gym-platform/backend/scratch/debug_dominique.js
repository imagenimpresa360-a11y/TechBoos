process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway',
    ssl: { rejectUnauthorized: false }
});
async function test() {
    try {
        const res1 = await pool.query("SELECT COUNT(*) FROM asistencia_packs");
        console.log("Total asistencia_packs:", res1.rows[0].count);

        const res2 = await pool.query("SELECT * FROM asistencia_packs WHERE LOWER(alumno_nombre) LIKE '%dominique%' OR LOWER(alumno_nombre) LIKE '%terre%' LIMIT 10");
        console.log("Asistencia Dominique:", res2.rows);
        
        const res3 = await pool.query("SELECT * FROM boxmagic_sales WHERE LOWER(cliente) LIKE '%dominique%' OR LOWER(cliente) LIKE '%terre%' ORDER BY id DESC LIMIT 5");
        console.log("Ventas Dominique:", res3.rows.map(r => ({fecha_pago: r.fecha_pago, plan: r.plan})));

    } finally { pool.end(); }
}
test();
