const { Pool } = require('pg');

const CLOUD_URL = "postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway";
const cloudPool = new Pool({ connectionString: CLOUD_URL, ssl: { rejectUnauthorized: false } });

async function seedCloud() {
    console.log("🚀 Inyectando Datos Maestros a Railway...");
    try {
        // 1. Plan de Cuentas (Categorías)
        const cuentas = [
            ['GEN-INC', 'Ingresos Generales', 'Ingreso'],
            ['BM-INC', 'Ventas BoxMagic', 'Ingreso'],
            ['VPOS-INC', 'Ventas VirtualPOS', 'Ingreso'],
            ['NOM-EXP', 'Pago de Nómina', 'Egreso'],
            ['ARR-EXP', 'Arriendo Sede', 'Egreso'],
            ['LIO-EXP', 'Facturas Compra (Lioren)', 'Egreso'],
            ['SUP-EXP', 'Suministros y Gastos Varios', 'Egreso']
        ];

        for(const c of cuentas) {
            await cloudPool.query(
                `INSERT INTO "CuentaContable" (id, nombre, tipo) VALUES (gen_random_uuid(), $1, $2) ON CONFLICT DO NOTHING`,
                [c[1], c[2]]
            );
        }
        console.log("✅ Cuentas Contables inyectadas.");

        // 2. Migrar Egresos de Abril Local (Si existen)
        // Por ahora inyectamos unos de prueba para activar el modulo
        await cloudPool.query(`
            INSERT INTO "Egreso" (id, mes, detalle, monto, abonado, sede, status, cuenta, origen, "updatedAt")
            VALUES 
            (gen_random_uuid(), 'Abril', 'Arriendo Campanario (Simulado)', 1200000, 1200000, 'Campanario', 'PAGADO', 'Arriendo Sede', 'Manual', NOW()),
            (gen_random_uuid(), 'Abril', 'Suministros Aseo', 45000, 0, 'Marina', 'PENDIENTE', 'Suministros', 'Manual', NOW())
            ON CONFLICT DO NOTHING
        `);
        console.log("✅ Egresos de prueba inyectados.");

    } catch (err) {
        console.error("❌ ERROR:", err);
    } finally {
        await cloudPool.end();
    }
}

seedCloud();
