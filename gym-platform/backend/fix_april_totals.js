const { Pool } = require('pg');
const pool = new Pool({ connectionString: "postgresql://postgres:Imagen30@localhost:5432/boos_erp_db" });

async function fixApril() {
    try {
        const res = await pool.query(
            "SELECT SUM(monto) as total FROM bci_income_pool WHERE fecha_banco >= '2026-04-01' AND fecha_banco <= '2026-04-30'"
        );
        const total = res.rows[0].total || 0;
        console.log(`\n📅 REPORTE DE CORTE (Modelado Inteligente):`);
        console.log(`-------------------------------------------`);
        console.log(`Monto real solo Abril: $${parseInt(total).toLocaleString()}`);
        
        // Ver cuanto era el "arrastre" de Marzo
        const res2 = await pool.query(
            "SELECT SUM(monto) as total FROM bci_income_pool WHERE fecha_banco < '2026-04-01'"
        );
        console.log(`Monto descartado (Arrastre Marzo): $${parseInt(res2.rows[0].total || 0).toLocaleString()}`);
        
    } catch (err) { console.error(err); }
    finally { pool.end(); }
}
fixApril();
