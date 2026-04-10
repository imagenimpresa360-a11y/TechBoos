const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({ connectionString: "postgresql://postgres:Imagen30@localhost:5432/boos_erp_db" });

async function runSQL() {
    try {
        const sql = fs.readFileSync('v54_schema.sql', 'utf8');
        await pool.query(sql);
        console.log("Tablas de Produccion v54 creadas exitosamente");
    } catch (e) {
        console.error("Error al crear tablas", e);
    } finally {
        pool.end();
    }
}

runSQL();
