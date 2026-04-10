const { Pool } = require('pg');

const CLOUD_URL = "postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway";
const LOCAL_URL = "postgresql://postgres:Imagen30@localhost:5432/boos_erp_db";

const cloudPool = new Pool({ connectionString: CLOUD_URL, ssl: { rejectUnauthorized: false } });
const localPool = new Pool({ connectionString: LOCAL_URL });

async function migrate() {
    console.log("🚀 Iniciando Migracion Maestra Local -> Railway...");

    try {
        // 1. Crear Schema en la Nube
        console.log("1. Creando Tablas en Railway...");
        await cloudPool.query(`
            CREATE TABLE IF NOT EXISTS "CuentaContable" (id UUID PRIMARY KEY, nombre TEXT, tipo TEXT);
            CREATE TABLE IF NOT EXISTS "Nomina" (id UUID PRIMARY KEY, mes TEXT, coach TEXT, rut TEXT, cargo TEXT, "valorHora" INT, "hrsCamp" INT, "hrsMarina" INT, status TEXT, cuenta TEXT, "updatedAt" TIMESTAMP);
            CREATE TABLE IF NOT EXISTS "Egreso" (id UUID PRIMARY KEY, mes TEXT, detalle TEXT, monto INT, abonado INT, sede TEXT, status TEXT, cuenta TEXT, origen TEXT, "updatedAt" TIMESTAMP);
            CREATE TABLE IF NOT EXISTS "FacturaCompra" (id UUID PRIMARY KEY, folio TEXT, rut TEXT, proveedor TEXT, "fechaEmision" TEXT, "montoNeto" INT, iva INT, "montoTotal" INT, status TEXT, "updatedAt" TIMESTAMP);
            CREATE TABLE IF NOT EXISTS bci_income_pool (id SERIAL PRIMARY KEY, fecha_banco DATE, monto INT, nombre_banco TEXT, nro_operacion TEXT UNIQUE, estado_match TEXT DEFAULT 'PENDIENTE');
            CREATE TABLE IF NOT EXISTS boxmagic_sales (id SERIAL PRIMARY KEY, fecha_pago TEXT, cliente TEXT, monto INT, tipo_pago TEXT, vendedor TEXT, sede TEXT, mes TEXT);
            CREATE TABLE IF NOT EXISTS daily_reconciliation (id SERIAL PRIMARY KEY, boxmagic_id INT, boxmagic_nombre TEXT, boxmagic_monto INT, bci_income_id INT, nivel_match TEXT, created_at TIMESTAMP DEFAULT NOW());
        `);

        // 2. Traer abonos de Abril de local
        console.log("2. Extrayendo datos de Abril de Local...");
        const localData = await localPool.query("SELECT * FROM bci_income_pool WHERE fecha_banco >= '2026-04-01'");
        console.log(`   --> ${localData.rows.length} registros encontrados.`);

        // 3. Inyectar en la Nube
        console.log("3. Inyectando abonos en Railway...");
        for(const r of localData.rows) {
            await cloudPool.query(
                "INSERT INTO bci_income_pool (fecha_banco, monto, nombre_banco, nro_operacion) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING",
                [r.fecha_banco, r.monto, r.nombre_banco, r.nro_operacion]
            );
        }

        console.log("✅ MIGRACION COMPLETADA CON EXITO.");

    } catch (err) {
        console.error("❌ ERROR EN MIGRACION:", err);
    } finally {
        await cloudPool.end();
        await localPool.end();
    }
}

migrate();
