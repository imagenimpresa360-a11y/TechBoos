const { Pool } = require('pg');

const CLOUD_URL = "postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway";
const cloudPool = new Pool({ connectionString: CLOUD_URL, ssl: { rejectUnauthorized: false } });

async function diagnostico() {
    console.log("🔍 DIAGNÓSTICO PROFUNDO DE NUBE...");
    try {
        // 1. Ver tablas existentes
        const tables = await cloudPool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("📁 TABLAS ENCONTRADAS:", tables.rows.map(r => r.table_name).join(', '));

        // 2. Ver conteo de cuentas
        const cuentas = await cloudPool.query('SELECT count(*) FROM "CuentaContable"');
        console.log("📊 TOTAL CUENTAS:", cuentas.rows[0].count);

        // 3. Ver conteo de egresos
        const egresos = await cloudPool.query('SELECT count(*) FROM "Egreso"');
        console.log("💸 TOTAL EGRESOS:", egresos.rows[0].count);

    } catch (err) {
        console.error("❌ ERROR EN DIAGNÓSTICO:", err.message);
    } finally {
        await cloudPool.end();
    }
}

diagnostico();
