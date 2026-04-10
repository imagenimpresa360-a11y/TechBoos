const { Pool } = require('pg');
const pool = new Pool({ connectionString: "postgresql://postgres:Imagen30@localhost:5432/boos_erp_db" });

async function searchInBoxMagic() {
    console.log("🔍 Buscando en BoxMagic Sales...");
    try {
        const res = await pool.query(
            `SELECT * FROM boxmagic_sales 
             WHERE cliente ILIKE '%CAMILA%' OR cliente ILIKE '%ROJAS%' 
                OR cliente ILIKE '%MORAGA%'`
        );
        console.log(`📦 Hallazgos en BoxMagic: ${res.rows.length}`);
        res.rows.forEach(r => console.log(`   - [${r.fecha_pago}] $${r.monto} | ${r.cliente} | Tipo: ${r.tipo_pago} | Sede: ${r.sede}`));
    } catch (err) { console.error(err); }
    finally { pool.end(); }
}
searchInBoxMagic();
