const { Pool } = require('pg');
const pool = new Pool({ 
    connectionString: 'postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway', 
    ssl: { rejectUnauthorized: false } 
});

async function findTheDollars() {
    try {
        const res = await pool.query('SELECT * FROM "Nomina"');
        console.log("📊 DATOS ENCONTRADOS EN NOMINA:");
        res.rows.forEach(r => {
            console.log(`- ${r.coach}: ${r.valorHora} (Cargo: ${r.cargo})`);
        });
    } catch (e) {
        console.error("❌ ERROR:", e.message);
    } finally {
        await pool.end();
    }
}

findTheDollars();
