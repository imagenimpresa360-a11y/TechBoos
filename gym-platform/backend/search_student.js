const { Pool } = require('pg');
const pool = new Pool({ connectionString: "postgresql://postgres:Imagen30@localhost:5432/boos_erp_db" });

async function searchDeep() {
    console.log("🔍 Búsqueda Exhaustiva: Camila Rojas Moraga\n");
    try {
        // 1. Buscar coincidencias parciales de nombre
        const res = await pool.query(
            `SELECT * FROM bci_income_pool 
             WHERE nombre_banco ILIKE '%CAMILA%' 
                OR nombre_banco ILIKE '%MORAGA%' 
                OR nombre_banco ILIKE '%ACHS%'
                OR nombre_banco ILIKE '%18535196%'`
        );
        
        console.log(`🏦 Hallazgos en BCI: ${res.rows.length}`);
        res.rows.forEach(r => console.log(`   - [${r.fecha_banco}] $${r.monto} | ${r.nombre_banco}`));

        // 2. Ver transacciones recientes (Abril) para ver si hay algo sospechoso
        const recent = await pool.query(
            `SELECT * FROM bci_income_pool WHERE fecha_banco >= '2026-04-01' ORDER BY fecha_banco DESC LIMIT 20`
        );
        console.log("\n📅 Transacciones Recientes en Abril (Top 20):");
        recent.rows.forEach(r => console.log(`   - [${r.fecha_banco}] $${r.monto} | ${r.nombre_banco}`));

    } catch (err) { console.error(err); }
    finally { pool.end(); }
}
searchDeep();
