const { Pool } = require('pg');
const pool = new Pool({ connectionString: "postgresql://postgres:Imagen30@localhost:5432/boos_erp_db" });

async function limpiar() {
    try {
        console.log("Detectando duplicados...");
        const result = await pool.query(`
            DELETE FROM "FacturaCompra" 
            WHERE id NOT IN (
                SELECT MIN(id) 
                FROM "FacturaCompra" 
                GROUP BY folio, rut
            ) RETURNING id;
        `);
        console.log(`Se eliminaron ${result.rowCount} facturas duplicadas.`);
    } catch(e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
limpiar();
