const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const upload = multer({ dest: 'uploads/' });


const app = express();
const PORT = process.env.PORT || 3001;
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:Imagen30@localhost:5432/boos_erp_db",
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

app.use(cors());
app.use(express.json());

// Middleware anti-caché para datos contables
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ENDPOINT DE SALUD (Debug)
app.get('/api/health', async (req, res) => {
    try {
        const cuentasRes = await pool.query('SELECT count(*) FROM "CuentaContable"');
        const egresosRes = await pool.query('SELECT count(*) FROM "Egreso"');
        res.json({
            status: 'online',
            db: 'connected',
            counts: {
                cuentas: cuentasRes.rows[0].count,
                egresos: egresosRes.rows[0].count
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// SERVIR FRONTEND (PRODUCCION)
app.use(express.static(path.join(__dirname, '../dist')));

app.get('/api/cuentas', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM "CuentaContable" ORDER BY CASE tipo WHEN 'Ingreso' THEN 1 WHEN 'Egreso' THEN 2 WHEN 'Pasivo' THEN 3 ELSE 4 END, nombre ASC`);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/cuentas', async (req, res) => {
  try {
    const { nombre, tipo } = req.body;
    const result = await pool.query('INSERT INTO "CuentaContable" (id, nombre, tipo) VALUES (gen_random_uuid(), $1, $2) RETURNING *', [nombre, tipo]);
    res.json(result.rows[0]);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/cuentas/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM "CuentaContable" WHERE id = $1', [req.params.id]);
    res.sendStatus(200);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/nomina/:mes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "Nomina" WHERE mes = $1', [req.params.mes]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/nomina', async (req, res) => {
  try {
    const { mes, nombre, rut, cargo, valorHora, hrsCamp, hrsMarina, status, cuenta } = req.body;
    const result = await pool.query('INSERT INTO "Nomina" (id, mes, coach, rut, cargo, "valorHora", "hrsCamp", "hrsMarina", status, cuenta, "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING *', [mes, nombre, rut, cargo, valorHora, hrsCamp, hrsMarina, status, cuenta]);
    res.json(result.rows[0]);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/nomina/:id', async (req, res) => {
  try {
    const { hrsCamp, hrsMarina, status } = req.body;
    const result = await pool.query('UPDATE "Nomina" SET "hrsCamp" = $1, "hrsMarina" = $2, status = $3, "updatedAt" = NOW() WHERE id = $4 RETURNING *', [hrsCamp, hrsMarina, status, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/egresos/:mes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "Egreso" WHERE mes = $1', [req.params.mes]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/egresos', async (req, res) => {
  try {
    const { mes, item, monto, abonado, sede, status, cat, origen } = req.body;
    const result = await pool.query('INSERT INTO "Egreso" (id, mes, detalle, monto, abonado, sede, status, cuenta, origen, "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *', [mes, item, monto, abonado, sede, status, cat, origen]);
    res.json(result.rows[0]);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/egresos/:id', async (req, res) => {
  try {
    const { abonado, status } = req.body;
    const result = await pool.query('UPDATE "Egreso" SET abonado = $1, status = $2, "updatedAt" = NOW() WHERE id = $3 RETURNING *', [abonado, status, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/egresos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM "Egreso" WHERE id = $1', [req.params.id]);
    res.sendStatus(200);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/compras/:mes', async (req, res) => {
  try {
    const { mes } = req.params;
    const mesToNum = { 'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08', 'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'};
    const num = mesToNum[mes.toLowerCase()] || '01';
    const result = await pool.query('SELECT * FROM "FacturaCompra" WHERE "fechaEmision" LIKE $1 OR "fechaEmision" LIKE $2 ORDER BY "fechaEmision" DESC', [`%-` + num + `-%`, `%` + num + `/%`]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/compras', async (req, res) => {
  try {
    const { folio, rut, proveedor, fechaEmision, montoNeto, iva, montoTotal } = req.body;
    
    // Verificación de Duplicados (Folio + RUT Proveedor)
    const existe = await pool.query('SELECT id FROM "FacturaCompra" WHERE folio = $1 AND rut = $2 LIMIT 1', [folio, rut]);
    if (existe.rows.length > 0) {
        return res.status(200).json({ message: "Factura ya ingresada previamente", data: existe.rows[0] });
    }

    const result = await pool.query(
      'INSERT INTO "FacturaCompra" (id, folio, rut, proveedor, "fechaEmision", "montoNeto", iva, "montoTotal", status, "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *',
      [folio, rut, proveedor, fechaEmision, montoNeto, iva, montoTotal, 'Pendiente']
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/compras/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query('UPDATE "FacturaCompra" SET status = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *', [status, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- MODULO CONCILIACION DIARIA ---
app.get('/api/conciliacion/pool', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM bci_income_pool WHERE estado_match = 'PENDIENTE' ORDER BY fecha_banco DESC`);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/conciliacion/match', async (req, res) => {
  try {
    const { bci_income_id, boxmagic_id, boxmagic_nombre, boxmagic_monto, nivel_match } = req.body;
    // 1. Marcar como enlazado
    await pool.query(`UPDATE bci_income_pool SET estado_match = 'ENLAZADO' WHERE id = $1`, [bci_income_id]);
    // 2. Crear registro de conciliacion
    const result = await pool.query(
      `INSERT INTO daily_reconciliation (boxmagic_id, boxmagic_nombre, boxmagic_monto, bci_income_id, nivel_match) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [boxmagic_id, boxmagic_nombre, boxmagic_monto, bci_income_id, nivel_match]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/conciliacion/reject', async (req, res) => {
  try {
    const { id } = req.body;
    const result = await pool.query(`UPDATE bci_income_pool SET estado_match = 'DESCARTADO' WHERE id = $1 RETURNING *`, [id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- MODULO INGESTA (ELIMINANDO DEPENDENCIAS LOCALES) ---

// Auxiliares limpieza
const cleanAmt = (v) => {
    if(!v) return 0;
    const s = String(v).replace(/\$|\.|\s/g, '').replace(',', '.');
    return parseInt(parseFloat(s)) || 0;
};

// 1. Ingesta BoxMagic (CSV)
app.post('/api/ingesta/boxmagic', upload.single('file'), async (req, res) => {
    try {
        const { sede, mes } = req.body;
        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        let count = 0;
        for (const row of data) {
            const fecha = row['Fecha de pago'] || row['Fecha'];
            const cliente = row['Cliente'];
            const monto = cleanAmt(row['Monto']);
            const tipo = row['Tipo'] || 'Otro';
            const vendedora = row['Vendedor/a'] || 'Desconocido';

            if (cliente && monto > 0) {
                await pool.query(
                    `INSERT INTO boxmagic_sales (fecha_pago, cliente, monto, tipo_pago, vendedor, sede, mes) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [fecha, cliente, monto, tipo, vendedora, sede, mes]
                );
                count++;
            }
        }
        fs.unlinkSync(req.file.path); // Limpiar temp
        res.json({ message: `Ingesta de ${count} registros exitosa para ${sede}`, count });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Ingesta BCI (Excel)
app.post('/api/ingesta/bci', upload.single('file'), async (req, res) => {
    try {
        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        let count = 0;
        let startIdx = -1;
        let colFecha = 0, colDesc = 5, colMonto = 10; // Defaults basados en Enero

        // Busqueda dinamica de encabezados (BCI MULTI-FORMATO)
        for(let i=0; i<rows.length; i++) {
            const rowStr = JSON.stringify(rows[i]).toLowerCase();
            if(rowStr.includes('descripción') || rowStr.includes('descripcion') || rowStr.includes('movimiento') || rowStr.includes('concepto')) {
                startIdx = i + 1;
                rows[i].forEach((cell, idx) => {
                    const c = String(cell).toLowerCase();
                    if(c.includes('fecha')) colFecha = idx;
                    if(c.includes('descrip') || c.includes('concep') || c.includes('movim')) colDesc = idx;
                    if(c.includes('abono') || c.includes('depósito') || c.includes('deposito') || c.includes('crédito') || c.includes('credito') || c.includes('entrada')) colMonto = idx;
                });
                break;
            }
        }

        if(startIdx === -1) {
             fs.unlinkSync(req.file.path);
             return res.status(400).json({ error: "No se encontró la cabecera 'Descripción' o 'Abonos' en el archivo." });
        }

        for (let i = startIdx; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 5) continue;

            const desc = String(row[colDesc] || '').toUpperCase();
            const montoRaw = row[colMonto];
            const monto = cleanAmt(montoRaw);
            const fechaVal = row[colFecha];

            if (monto > 0 && desc && !desc.includes('SALDO ACTUAL')) {
                let fechaStr;
                if(typeof fechaVal === 'number') {
                    const dateObj = new Date((fechaVal - 25569) * 86400 * 1000);
                    fechaStr = dateObj.toISOString().split('T')[0];
                } else {
                    // Manejo de fecha texto "DD/MM/YYYY"
                    const parts = String(fechaVal).split('/');
                    fechaStr = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : String(fechaVal);
                }

                // Hashing para evitar duplicados si suben el mismo archivo 2 veces
                const hashId = crypto.createHash('md5').update(`${fechaStr}-${desc}-${monto}`).digest('hex');

                await pool.query(
                    `INSERT INTO bci_income_pool (fecha_banco, monto, nombre_banco, nro_operacion) 
                     VALUES ($1, $2, $3, $4) 
                     ON CONFLICT (nro_operacion) DO NOTHING`,
                    [fechaStr, monto, desc, hashId]
                );
                count++;
            }
        }
        fs.unlinkSync(req.file.path);
        res.json({ message: `Ingesta de ${count} abonos BCI exitosa`, count });
    } catch (err) { 
        if(req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: err.message }); 
    }
});

// --- ESTADISTICAS PARA DASHBOARD ---
app.get('/api/stats/:mes', async (req, res) => {
    try {
        const { mes } = req.params;
        const mesToNum = { 'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08', 'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'};
        const num = mesToNum[mes.toLowerCase()] || '01';
        const dateFilter = `2026-${num}-%`;

        const bciRes = await pool.query(`SELECT SUM(monto) as total FROM bci_income_pool WHERE fecha_banco::text LIKE $1`, [dateFilter]);
        const vposRes = await pool.query(`SELECT SUM(monto) as total FROM bci_income_pool WHERE fecha_banco::text LIKE $1 AND nombre_banco LIKE '%VIRTUALPOS%'`, [dateFilter]);
        const bmRes = await pool.query(`SELECT SUM(monto) as total FROM boxmagic_sales WHERE mes = $1`, [mes]);
        const egRes = await pool.query(`SELECT SUM(monto) as total FROM "Egreso" WHERE mes = $1`, [mes]);

        res.json({
            bci: { abonos: parseInt(bciRes.rows[0].total) || 0, egresos: 0 },
            virtualpost: { abonos: parseInt(vposRes.rows[0].total) || 0 },
            boxmagic: { abonos: parseInt(bmRes.rows[0].total) || 0 },
            erp_egresos: parseInt(egRes.rows[0].total) || 0
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Comodín para SPA (React Router fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => { console.log(`🚀 SERVIDOR CLOUD v62.0 CORRIENDO EN PUERTO: ${PORT}`); });
