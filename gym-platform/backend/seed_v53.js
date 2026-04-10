const { Pool } = require('pg');

const pool = new Pool({ connectionString: "postgresql://postgres:Imagen30@localhost:5432/boos_erp_db" });

async function seedV53() {
    try {
        await pool.query(`INSERT INTO bci_income_pool (fecha_banco, monto, nombre_banco, nro_operacion) VALUES 
            ('2026-04-08', 43000, 'TRANSFER DE MARGARITA TORRES', '8007124'),
            ('2026-04-08', 37900, 'TRANSFER DE JARA LEONELLI', '8007125'),
            ('2026-04-09', 22000, 'TRANSFER DE R MORAN', '8007126')
            ON CONFLICT DO NOTHING;
        `);
        console.log("Mock data ingresada");
    } finally { pool.end(); }
}
seedV53();
