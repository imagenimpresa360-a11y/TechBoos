const { Pool } = require('pg');
const xlsx = require('xlsx');
const crypto = require('crypto');

const pool = new Pool({ 
    connectionString: 'postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway', 
    ssl: { rejectUnauthorized: false } 
});

const files = [
    '../../agentes/02_CFO_Finanzas/BANCO BCI/CARTOLAS_MENSUALES/1. CARTOLA ENERO N1.xlsx',
    '../../agentes/02_CFO_Finanzas/BANCO BCI/CARTOLAS_MENSUALES/2. CARTOLA FEBRERO N2.xlsx',
    '../../agentes/02_CFO_Finanzas/BANCO BCI/CARTOLAS_MENSUALES/3. CARTOLA MARZO N3.xlsx'
];

const cleanAmt = (v) => { 
    if(v == null) return 0; 
    let str = String(v).replace(/[^0-9,-]/g, '').replace(',', '.'); 
    return Math.floor(parseFloat(str)) || 0; 
};

async function reInject() {
    try {
        console.log("🚀 INICIANDO RE-INYECCION DE EGRESOS BANCARIOS...");
        let count = 0;

        for (const filePath of files) {
            console.log(`🔍 Procesando: ${filePath}`);
            const workbook = xlsx.readFile(filePath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

            let startIdx = -1;
            for(let i=0; i<rows.length; i++){ if(JSON.stringify(rows[i]).includes('Descripción')){ startIdx = i+1; break; } }

            for (let i = startIdx; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.length < 10) continue;
                
                const desc = String(row[5] || '').toUpperCase();
                const cargo = cleanAmt(row[9] || 0);
                const abono = cleanAmt(row[10] || 0);
                const monto = abono > 0 ? abono : (cargo > 0 ? -cargo : 0);
                const fechaVal = row[0];

                if (monto !== 0 && desc && !desc.includes('SALDO')) {
                    let fechaStr;
                    if (typeof fechaVal === 'number') {
                        fechaStr = new Date((fechaVal - 25569) * 86400 * 1000).toISOString().split('T')[0];
                    } else {
                        const parts = String(fechaVal).split('/');
                        if (parts.length === 3) {
                            fechaStr = `${parts[2]}-${parts[1]}-${parts[0]}`; // Convertir DD/MM/YYYY a YYYY-MM-DD
                        } else {
                            fechaStr = String(fechaVal);
                        }
                    }
                    const hashId = crypto.createHash('md5').update(`M-${fechaStr}-${desc}-${monto}`).digest('hex');
                    
                    await pool.query(
                        `INSERT INTO bci_income_pool (fecha_banco, monto, nombre_banco, nro_operacion) 
                         VALUES ($1, $2, $3, $4) 
                         ON CONFLICT DO NOTHING`, 
                        [fechaStr, monto, desc, hashId]
                    );
                    count++;
                }
            }
        }
        console.log(`✅ HISTORIA SINCRONIZADA: ${count} movimientos bancarios (Ingresos y Egresos) cargados.`);
    } catch (e) {
        console.error("❌ ERROR:", e.message);
    } finally {
        await pool.end();
    }
}

reInject();
