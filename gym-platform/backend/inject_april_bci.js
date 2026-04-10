const { Pool } = require('pg');
const xlsx = require('xlsx');
const crypto = require('crypto');

const pool = new Pool({ 
    connectionString: 'postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway', 
    ssl: { rejectUnauthorized: false } 
});

const filePath = '../../agentes/02_CFO_Finanzas/BANCO BCI/CARTOLAS MOVIMIENTOS MES/cuenta abril the boos 09042026.xlsx';

const cleanAmt = (v) => { 
    if(v == null || v === "") return 0; 
    let str = String(v).replace(/[^0-9,-]/g, '').replace(',', '.'); 
    return Math.floor(parseFloat(str)) || 0; 
};

async function injectApril() {
    try {
        console.log("🚀 INICIANDO INYECCION DE MOVIMIENTOS ABRIL...");
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        let count = 0;
        // Saltear cabeceras (fila 0 y 1)
        for (let i = 2; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 5) continue;

            const desc = String(row[2] || '').toUpperCase();
            const cargo = cleanAmt(row[3]);
            const abono = cleanAmt(row[4]);
            const monto = abono > 0 ? abono : (cargo > 0 ? -cargo : 0);
            const fechaVal = row[0];

            if (monto !== 0 && desc) {
                let fechaStr;
                if (typeof fechaVal === 'number') {
                    fechaStr = new Date((fechaVal - 25569) * 86400 * 1000).toISOString().split('T')[0];
                } else {
                    const parts = String(fechaVal).split('/');
                    fechaStr = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : String(fechaVal);
                }

                const hashId = crypto.createHash('md5').update(`ABR-${fechaStr}-${desc}-${monto}`).digest('hex');
                await pool.query(
                    `INSERT INTO bci_income_pool (fecha_banco, monto, nombre_banco, nro_operacion) 
                     VALUES ($1, $2, $3, $4) 
                     ON CONFLICT DO NOTHING`, 
                    [fechaStr, monto, desc, hashId]
                );
                count++;
            }
        }
        console.log(`✅ ABRIL SINCRONIZADO: ${count} movimientos locales cargados.`);
    } catch (e) {
        console.error("❌ ERROR:", e.message);
    } finally {
        await pool.end();
    }
}

injectApril();
