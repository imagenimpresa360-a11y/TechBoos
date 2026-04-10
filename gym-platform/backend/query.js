const { Pool } = require('pg');
const pool = new Pool({ connectionString: "postgresql://postgres:Imagen30@localhost:5432/boos_erp_db" });

async function selectAll() {
    try {
        const resultCompra = await pool.query('SELECT * FROM "FacturaCompra" LIMIT 5;');
        const resultNomina = await pool.query('SELECT * FROM "Nomina" WHERE mes = \'enero\' LIMIT 5;');
        console.log("Comprass:", resultCompra.rows);
        console.log("Nominas:", resultNomina.rows);
    } catch(e) {
         console.error(e);
    } finally {
        pool.end();
    }
}
selectAll();
