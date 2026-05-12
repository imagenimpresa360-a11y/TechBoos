process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway',
    ssl: { rejectUnauthorized: false }
});

async function motorPrediccion() {
    console.log('🧠 Iniciando Motor de Atención Predictiva...');
    try {
        const socios = await pool.query("SELECT id, nombre FROM socios");
        console.log(`Analizando ${socios.rows.length} alumnos...`);

        for (const s of socios.rows) {
            // 1. Analizar Horario (desde asistencia_packs)
            // Asumimos que asistencia_packs tiene una columna 'hora' (ej: "07:00", "19:30")
            const asistencia = await pool.query("SELECT hora FROM asistencia_packs WHERE alumno_nombre ILIKE $1", [`%${s.nombre}%`]);
            let perfilHorario = 'Sin datos';
            if (asistencia.rows.length > 0) {
                const horas = asistencia.rows.map(a => parseInt(a.hora.split(':')[0]));
                const amCount = horas.filter(h => h < 13).length;
                const pmCount = horas.filter(h => h >= 13).length;
                perfilHorario = amCount >= pmCount ? 'Mañana (AM)' : 'Tarde (PM)';
            }

            // 2. Analizar Disciplina (desde boxmagic_sales)
            const ventas = await pool.query("SELECT plan FROM boxmagic_sales WHERE cliente ILIKE $1", [`%${s.nombre}%`]);
            let perfilDisciplina = 'Multidisciplina';
            if (ventas.rows.length > 0) {
                const planes = ventas.rows.map(v => v.plan.toUpperCase());
                if (planes.some(p => p.includes('CROSSFIT') || p.includes('CF '))) perfilDisciplina = 'Crossfit';
                else if (planes.some(p => p.includes('FUNCIONAL'))) perfilDisciplina = 'Ent. Funcional';
                else if (planes.some(p => p.includes('KID'))) perfilDisciplina = 'TechBoos Kids';
                else if (planes.some(p => p.includes('SENIOR'))) perfilDisciplina = 'Senior';
                else if (planes.some(p => p.includes('HYBRID'))) perfilDisciplina = 'Hybrid';
                else if (planes.some(p => p.includes('PILARES'))) perfilDisciplina = 'Pilares';
            }

            // 3. Actualizar Socio
            await pool.query(
                "UPDATE socios SET perfil_horario = $1, perfil_disciplina = $2 WHERE id = $3",
                [perfilHorario, perfilDisciplina, s.id]
            );
        }
        console.log('✅ Inteligencia Predictiva actualizada para todos los alumnos.');
    } catch (err) {
        console.error('❌ Error en Motor Prediccion:', err.message);
    } finally {
        pool.end();
    }
}

motorPrediccion();
