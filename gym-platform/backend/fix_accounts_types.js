const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway', ssl: { rejectUnauthorized: false } });

async function fixAccounts() {
    const egresos = [
        'Sueldos de Entrenadores',
        'Mantenimiento de Equipos (reparacion o compra)',
        'Administración (gerencia y admin)',
        'Asesores',
        'Limpieza y Aseo y Art. Aseo.',
        'Impuestos, convenios y rentas',
        'SERV BASICOS LUZ',
        'SERVICIOS BASICOS AGUA',
        'INTERNET',
        'Leyes Sociales (Previred)',
        'RRSS Redes Sociales'
    ];

    const pasivos = [
        'IVA por Pagar (Débito Fiscal)',
        'Retenciones Honorarios 13.75%',
        'Préstamos Bancarios Largo Plazo',
        'Cuentas por Pagar Proveedores'
    ];

    try {
        console.log("🔄 RECLASIFICANDO CUENTAS...");
        
        for (const nombre of egresos) {
            await pool.query('UPDATE "CuentaContable" SET tipo = $1 WHERE nombre = $2', ['Egreso', nombre]);
            console.log(`✅ [Egreso] - ${nombre}`);
        }

        for (const nombre of pasivos) {
            await pool.query('UPDATE "CuentaContable" SET tipo = $1 WHERE nombre = $2', ['Pasivo', nombre]);
            console.log(`✅ [Pasivo] - ${nombre}`);
        }

        console.log("✨ ¡PROCESO DE RECLASIFICACIÓN COMPLETADO!");
    } catch (e) {
        console.error("❌ ERROR:", e.message);
    } finally {
        await pool.end();
    }
}
fixAccounts();
