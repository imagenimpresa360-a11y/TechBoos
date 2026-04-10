const { Pool } = require('pg');
const xlsx = require('xlsx');
const path = require('path');

const pool = new Pool({ 
    connectionString: 'postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway', 
    ssl: { rejectUnauthorized: false } 
});

const files = [
    '../../agentes/06_Ingeniero_Datos/VIRTUAL POST/1.-enero virtualpost.xlsx',
    '../../agentes/06_Ingeniero_Datos/VIRTUAL POST/2.- Febrero vitualpost.xlsx',
    '../../agentes/06_Ingeniero_Datos/VIRTUAL POST/3.- Marzo virtualpost.xlsx',
    '../../agentes/06_Ingeniero_Datos/VIRTUAL POST/4.- Abril virtualpost.xlsx'
];

async function setup() {
    try {
        console.log("🛠️ CREANDO TABLA VIRTUALPOS...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS virtualpos_sales (
                id TEXT PRIMARY KEY,
                monto INTEGER,
                comision INTEGER,
                total_abono INTEGER,
                cliente TEXT,
                fecha DATE,
                estado TEXT
            )
        `);

        console.log("🚀 INICIANDO INYECCION MASIVA...");
        let count = 0;

        for (const filePath of files) {
            console.log(`🔍 Procesando: ${path.basename(filePath)}`);
            const workbook = xlsx.readFile(filePath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = xlsx.utils.sheet_to_json(sheet);

            for (const row of rows) {
                const id = String(row['id']);
                const monto = parseInt(row['monto']) || 0;
                const comision = parseInt(row['comision']) || 0;
                const abono = parseInt(row['total_abono']) || 0;
                const cliente = String(row['cliente'] || 'Desconocido');
                const estado = String(row['estado']);
                
                // Fecha de Excel serial a ISO
                const fechaRaw = row['fecha'];
                const fecha = new Date((fechaRaw - 25569) * 86400 * 1000).toISOString().split('T')[0];

                await pool.query(
                    `INSERT INTO virtualpos_sales (id, monto, comision, total_abono, cliente, fecha, estado) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7) 
                     ON CONFLICT (id) DO NOTHING`,
                    [id, monto, comision, abono, cliente, fecha, estado]
                );
                count++;
            }
        }
        console.log(`✅ PROCESO COMPLETADO: ${count} ventas de VirtualPOS sincronizadas.`);
    } catch (e) {
        console.error("❌ ERROR:", e.message);
    } finally {
        await pool.end();
    }
}

setup();
