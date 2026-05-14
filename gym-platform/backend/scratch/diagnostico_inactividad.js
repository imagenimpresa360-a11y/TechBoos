process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway',
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        // Ver una muestra de los datos de boxmagic_sales para entender el modelo
        const muestra = await pool.query(`
            SELECT cliente, plan, fecha_pago, estado_pago, mes
            FROM boxmagic_sales 
            WHERE LOWER(cliente) LIKE '%cambareri%'
            ORDER BY fecha_pago DESC
            LIMIT 20
        `);
        console.log('=== Muestra boxmagic_sales (Cambareri) ===');
        muestra.rows.forEach(r => console.log(JSON.stringify(r)));

        // Ver si hay tabla de planes vigentes o membresías activas
        const tablas = await pool.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('\n=== Tablas disponibles ===');
        tablas.rows.forEach(r => console.log(r.table_name));

        // Ver cómo está el estado en socios para esos alumnos
        const socio = await pool.query(`
            SELECT nombre, email, estado, fecha_ultimo_pago, dias_inactivo, segmento_riesgo
            FROM socios 
            WHERE LOWER(nombre) LIKE '%cambareri%'
        `);
        console.log('\n=== Estado en socios ===');
        socio.rows.forEach(r => console.log(JSON.stringify(r)));

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        pool.end();
    }
}
main();
