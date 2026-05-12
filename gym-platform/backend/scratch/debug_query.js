process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway',
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        const whereClause = "WHERE s.estado = 'Inactivo'";
        const params = [50, 0];
        const result = await pool.query(`
            SELECT s.id, s.nombre, s.email, s.telefono, s.sede_habitual, s.fecha_ultimo_pago, 
                   s.monto_promedio, s.dias_inactivo, s.segmento_riesgo, s.notas, s.estado,
                   s.perfil_horario, s.perfil_disciplina,
                (SELECT json_agg(h ORDER BY h.fecha_contacto DESC) FROM campanas_recuperacion h WHERE h.socio_id = s.id) as historial,
                (SELECT string_agg(DISTINCT plan, ', ') FROM boxmagic_sales WHERE LOWER(cliente) = LOWER(s.nombre)) as planes_historicos
            FROM socios s ${whereClause}
            ORDER BY CASE s.segmento_riesgo WHEN 'Amarillo' THEN 1 WHEN 'Rojo' THEN 2 WHEN 'Critico' THEN 3 WHEN 'Alumnosfuga' THEN 4 ELSE 5 END ASC, s.monto_promedio DESC
            LIMIT $1 OFFSET $2
        `, params);
        console.log('Query OK. Rows:', result.rows.length);
    } catch (err) {
        console.error('SQL ERROR:', err.message);
    } finally {
        pool.end();
    }
}
main();
