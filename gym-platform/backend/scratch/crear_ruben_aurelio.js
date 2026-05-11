const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway',
    ssl: { rejectUnauthorized: false }
});

async function crearAlumno() {
    try {
        // Verificar si ya existe
        const existe = await pool.query("SELECT id FROM socios WHERE email = 'r.rojas@imagenyconcepto.cl'");
        if (existe.rows.length > 0) {
            console.log('⚠️ El alumno ya existe con ID:', existe.rows[0].id);
            process.exit(0);
        }

        const result = await pool.query(`
            INSERT INTO socios (id, nombre, email, estado, segmento_riesgo, sede_habitual, monto_promedio, created_at)
            VALUES (gen_random_uuid(), 'Ruben Aurelio', 'r.rojas@imagenyconcepto.cl', 'Inactivo', 'Alumnosfuga', 'Campanario', 19900, '2024-08-15')
            RETURNING id, nombre, email, estado, segmento_riesgo
        `);
        console.log('✅ Alumno creado exitosamente:');
        console.table(result.rows);
        console.log('\n🔗 Link de pago:');
        console.log('https://techboos-production-edd2.up.railway.app/pago/' + result.rows[0].id);
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
    process.exit(0);
}

crearAlumno();
