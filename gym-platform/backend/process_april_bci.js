const { Pool } = require('pg');
const xlsx = require('xlsx');
const crypto = require('crypto');

const pool = new Pool({ connectionString: "postgresql://postgres:Imagen30@localhost:5432/boos_erp_db" });

async function processBCIApril() {
    const filePath = 'C:\\Users\\DELL\\Desktop\\TECHEMPRESA\\agentes\\02_CFO_Finanzas\\BANCO BCI\\CARTOLAS MOVIMIENTOS MES\\cuenta abril the boos 09042026.xlsx';
    
    try {
        const wb = xlsx.readFile(filePath);
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        
        let count = 0;
        let totalIncome = 0;

        for (let i = 2; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 5) continue;

            const fechaSerial = row[0];
            const desc = String(row[2] || '').trim().toUpperCase();
            const ingreso = parseInt(row[4]) || 0;

            if (ingreso > 0) {
                // Convertir fecha de Excel a Date string
                const dateObj = new Date((fechaSerial - 25569) * 86400 * 1000);
                const fechaStr = dateObj.toISOString().split('T')[0];

                // Generar hash único para evitar duplicados si no hay ID nativo
                const rawId = `${fechaStr}-${desc}-${ingreso}`;
                const hashId = crypto.createHash('md5').update(rawId).digest('hex');

                // Evitar VirtualPOS en el pool de ingresos directos (ya que tenemos su tarjeta aparte)
                // O dejarlo para que cuadre el banco y luego separarlo en el dashboard
                
                await pool.query(
                    `INSERT INTO bci_income_pool (fecha_banco, monto, nombre_banco, nro_operacion) 
                     VALUES ($1, $2, $3, $4) 
                     ON CONFLICT (nro_operacion) DO NOTHING`,
                    [fechaStr, ingreso, desc, hashId]
                );
                
                count++;
                totalIncome += ingreso;
            }
        }
        
        console.log(`✅ PROCESO COMPLETADO: Abríl 2026`);
        console.log(`🏦 Registros nuevos/validados: ${count}`);
        console.log(`💰 Total Ingresos en Banco: $${totalIncome.toLocaleString()}`);
        
    } catch (err) {
        console.error("❌ Error procesando cartola de Abril:", err);
    } finally {
        pool.end();
    }
}

processBCIApril();
