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

            // 2. Analizar Disciplinas (Top 2 más frecuentes)
            const ventas = await pool.query("SELECT plan FROM boxmagic_sales WHERE cliente ILIKE $1", [`%${s.nombre}%`]);
            let perfilDisciplina = 'Multidisciplina';
            
            if (ventas.rows.length > 0) {
                const conteo = {
                    'Crossfit': 0,
                    'Ent. Funcional': 0,
                    'TechBoos Kids': 0,
                    'GAP': 0,
                    'Senior': 0,
                    'Hybrid': 0,
                    'Pilares': 0
                };

                ventas.rows.forEach(v => {
                    if (!v.plan) return;
                    const p = v.plan.toUpperCase();
                    if (p.includes('CROSSFIT') || p.includes('CF ')) conteo['Crossfit']++;
                    if (p.includes('FUNCIONAL')) conteo['Ent. Funcional']++;
                    if (p.includes('KID')) conteo['TechBoos Kids']++;
                    if (p.includes('GAP')) conteo['GAP']++;
                    if (p.includes('SENIOR')) conteo['Senior']++;
                    if (p.includes('HYBRID')) conteo['Hybrid']++;
                    if (p.includes('PILARES')) conteo['Pilares']++;
                });

                // Ordenar por frecuencia y tomar las 2 mejores
                const ordenadas = Object.entries(conteo)
                    .filter(([_, count]) => count > 0)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, _]) => name);

                if (ordenadas.length > 0) {
                    perfilDisciplina = ordenadas.slice(0, 2).join(' / ');
                }
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
