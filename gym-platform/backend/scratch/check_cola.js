process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway',
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        // 1. Verificar si la tabla existe
        const tablaCheck = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'cola_emails'
        `);
        console.log('¿Tabla cola_emails existe?', tablaCheck.rows.length > 0 ? '✅ SÍ' : '❌ NO - ESTE ES EL PROBLEMA');

        if (tablaCheck.rows.length === 0) {
            // 2. Crear la tabla si no existe
            console.log('Creando tabla cola_emails en Railway...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS cola_emails (
                    id SERIAL PRIMARY KEY,
                    socio_id UUID REFERENCES socios(id),
                    estado VARCHAR(20) DEFAULT 'Pendiente',
                    fecha_encolado TIMESTAMP DEFAULT NOW(),
                    fecha_envio TIMESTAMP
                )
            `);
            console.log('✅ Tabla cola_emails CREADA en Railway');
        } else {
            // 3. Ver cuántos registros tiene
            const count = await pool.query("SELECT COUNT(*) FROM cola_emails WHERE estado = 'Pendiente'");
            console.log('Registros pendientes en cola:', count.rows[0].count);
        }

        // 4. Verificar tabla asistencia_packs también
        const asisCheck = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'asistencia_packs'
        `);
        console.log('¿Tabla asistencia_packs existe?', asisCheck.rows.length > 0 ? '✅ SÍ' : '❌ NO');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        pool.end();
    }
}
main();
