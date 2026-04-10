const { Pool } = require('pg');

const LOCAL_URL = "postgresql://postgres:Imagen30@localhost:5432/boos_erp_db";
const CLOUD_URL = "postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway";

const localPool = new Pool({ connectionString: LOCAL_URL });
const cloudPool = new Pool({ connectionString: CLOUD_URL, ssl: { rejectUnauthorized: false } });

async function syncAccounts() {
    console.log("🛠️ Sincronizando Plan de Cuentas...");
    try {
        const localAccounts = await localPool.query('SELECT * FROM "CuentaContable"');
        console.log(`📡 Encontradas ${localAccounts.rows.length} cuentas locales.`);

        for(const acc of localAccounts.rows) {
            await cloudPool.query(
                'INSERT INTO "CuentaContable" (id, nombre, tipo) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                [acc.id, acc.nombre, acc.tipo]
            );
        }
        console.log("✅ Plan de Cuentas clonado satisfactoriamente.");
    } catch (err) {
        console.error("❌ Error en sincronizacion:", err);
    } finally {
        await localPool.end();
        await cloudPool.end();
    }
}

syncAccounts();
