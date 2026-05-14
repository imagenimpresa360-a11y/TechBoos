process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway',
    ssl: { rejectUnauthorized: false }
});

async function auditarActivos() {
    console.log('🛡️ Iniciando Auditoría de Seguridad Pre-Lanzamiento...');
    try {
        // 1. Buscar socios marcados como 'Inactivo' que tienen compras en los últimos 30 días
        const hoy = new Date();
        const hace30Dias = new Date(hoy.setDate(hoy.getDate() - 30)).toISOString().split('T')[0];

        const inconsistencias = await pool.query(`
            SELECT s.id, s.nombre, s.email, v.fecha_pago, v.plan
            FROM socios s
            JOIN boxmagic_sales v ON LOWER(s.nombre) = LOWER(v.cliente)
            WHERE s.estado = 'Inactivo' 
            AND v.fecha_pago >= $1
        `, [hace30Dias]);

        if (inconsistencias.rows.length > 0) {
            console.log(`⚠️ Se encontraron ${inconsistencias.rows.length} alumnos que ya volvieron pero figuran como Inactivos.`);
            
            for (const row of inconsistencias.rows) {
                console.log(`🔄 Actualizando a ${row.nombre}: Volvió el ${row.fecha_pago} con el plan ${row.plan}`);
                
                // Convertir DD/MM/YYYY a YYYY-MM-DD
                let fechaFormateada = null;
                if (row.fecha_pago && row.fecha_pago.includes('/')) {
                    const partes = row.fecha_pago.split('/');
                    if (partes.length === 3) {
                        fechaFormateada = `${partes[2]}-${partes[1]}-${partes[0]}`;
                    }
                }
                
                if (fechaFormateada) {
                    await pool.query(
                        "UPDATE socios SET estado = 'Activo', fecha_ultimo_pago = $1 WHERE id = $2",
                        [fechaFormateada, row.id]
                    );
                } else {
                    console.log(`⚠️ No se pudo formatear la fecha: ${row.fecha_pago}`);
                }
            }
            console.log('✅ Base de datos saneada. Estos alumnos ya no recibirán la promo.');
        } else {
            console.log('🟢 ¡Semáforo Verde! No se encontraron alumnos activos en la lista de inactivos.');
        }

    } catch (err) {
        console.error('❌ Error en Auditoría:', err.message);
    } finally {
        pool.end();
    }
}

auditarActivos();
