const { Pool } = require('pg');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const pool = new Pool({ 
    connectionString: 'postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway', 
    ssl: { rejectUnauthorized: false } 
});

const files = [
    '../../agentes/06_Ingeniero_Datos/lioren/2026/1.- enero libro de compras lioren.xlsx',
    '../../agentes/06_Ingeniero_Datos/lioren/2026/2.- febrero libro de compras lioren.xlsx',
    '../../agentes/06_Ingeniero_Datos/lioren/2026/3.- Marzo libro de compras lioren.xlsx',
    '../../agentes/06_Ingeniero_Datos/lioren/2026/4.- abril libro de compras lioren (incompleto) .xlsx'
];

async function inject() {
    try {
        console.log("🚀 INICIANDO INYECCION MASIVA LIOREN...");
        let totalCount = 0;

        for (const filePath of files) {
            console.log(`🔍 Procesando: ${path.basename(filePath)}`);
            const workbook = xlsx.readFile(filePath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = xlsx.utils.sheet_to_json(sheet);

            for (const row of rows) {
                const folio = String(row['Folio']);
                const rut = String(row['RUT']);
                const razon_social = String(row['Razón Social']);
                const fecha = String(row['Fecha']);
                const neto = parseInt(row['Monto Neto']) || 0;
                const iva = parseInt(row['Monto IVA']) || 0;
                const total = parseInt(row['Monto Total']) || 0;
                const tipo_doc = String(row['Tipo Documento']);

                await pool.query(
                    `INSERT INTO "FacturaCompra" (id, folio, rut, proveedor, "fechaEmision", "montoNeto", iva, "montoTotal", status, "updatedAt") 
                     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW()) 
                     ON CONFLICT DO NOTHING`,
                    [folio, rut, razon_social, fecha, neto, iva, total, 'Cargada']
                );
                totalCount++;
            }
        }
        console.log(`✅ INYECCION COMPLETADA: ${totalCount} facturas sincronizadas.`);
    } catch (e) {
        console.error("❌ ERROR CRITICO:", e.message);
    } finally {
        await pool.end();
    }
}

inject();
