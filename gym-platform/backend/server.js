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
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway",
  ssl: { rejectUnauthorized: false }
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
    const { mes, item, monto, abonado, sede, status, cat, origen, fecha } = req.body;
    const result = await pool.query('INSERT INTO "Egreso" (id, mes, detalle, monto, abonado, sede, status, cuenta, origen, fecha, "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING *', [mes, item, monto, abonado, sede, status, cat, origen, fecha]);
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

app.get('/api/compras/:mes', async (req, res) => {
  try {
    const { mes } = req.params;
    const mesToNum = { 'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08', 'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'};
    const num = mesToNum[mes.toLowerCase()] || '01';
    const datePattern = `2026-${num}-%`;
    const result = await pool.query('SELECT * FROM "FacturaCompra" WHERE "fechaEmision"::text LIKE $1 ORDER BY "fechaEmision" DESC', [datePattern]);
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

app.get('/api/virtualpos/:mes', async (req, res) => {
  try {
    const { mes } = req.params;
    const mesToNum = { 'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08', 'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'};
    const num = mesToNum[mes.toLowerCase()] || '01';
    const datePattern = `2026-${num}-%`;
    const result = await pool.query('SELECT * FROM virtualpos_sales WHERE fecha::text LIKE $1 ORDER BY fecha DESC', [datePattern]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
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

// --- SUB-LEDGER POR SEDE (Escenario B — SAP/Oracle Style) ---

// GET /api/sedes → Catálogo de sedes activas
app.get('/api/sedes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sedes WHERE activa = true ORDER BY nombre');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/boxmagic/:sede/:mes → Ingresos BoxMagic filtrados por sede y mes
app.get('/api/boxmagic/:sede/:mes', async (req, res) => {
  try {
    const { sede, mes } = req.params;
    const query = sede === 'Todas'
      ? `SELECT * FROM boxmagic_sales WHERE mes = $1 ORDER BY fecha_pago DESC`
      : `SELECT * FROM boxmagic_sales WHERE sede = $1 AND mes = $2 ORDER BY fecha_pago DESC`;
    const params = sede === 'Todas' ? [mes] : [sede, mes];
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/boxmagic/resumen/:mes → Totales por sede y tipo de pago para el dashboard
app.get('/api/boxmagic/resumen/:mes', async (req, res) => {
  try {
    const { mes } = req.params;
    const result = await pool.query(`
      SELECT 
        sede,
        tipo_pago,
        COUNT(*)                              AS cantidad,
        SUM(monto)                            AS total,
        SUM(CASE WHEN estado_conciliacion = 'CONCILIADO' THEN monto ELSE 0 END) AS conciliado,
        SUM(CASE WHEN estado_conciliacion = 'PENDIENTE'  THEN monto ELSE 0 END) AS pendiente
      FROM boxmagic_sales
      WHERE mes = $1
      GROUP BY sede, tipo_pago
      ORDER BY sede, tipo_pago
    `, [mes]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/boxmagic/reconcile/auto/:mes → Motor de Triangulación Inteligente
app.post('/api/boxmagic/reconcile/auto/:mes', async (req, res) => {
    try {
        const { mes } = req.params;
        let matchedCount = 0;

        // 1. Obtener ventas pendientes del mes
        const salesRes = await pool.query(`SELECT * FROM boxmagic_sales WHERE mes = $1 AND estado_conciliacion = 'PENDIENTE'`, [mes]);
        const sales = salesRes.rows;

        // 2. Obtener pool bancario sin conciliar
        const bankRes = await pool.query(`SELECT * FROM bci_income_pool WHERE monto > 0`);
        const bank = bankRes.rows;

        // Mapeo de meses a números para cálculos de fecha
        const mesMap = { 'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08', 'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12' };
        const mesNum = mesMap[mes.toLowerCase()];

        for (const s of sales) {
            // Regla 1: Triangulación por Monto e Identidad (Nombre/RUT)
            let match = bank.find(b => 
                b.monto === s.monto && 
                ((b.nombre_remitente && s.cliente.toLowerCase().includes(b.nombre_remitente.toLowerCase().split(' ')[0])) || 
                 (b.rut_remitente && s.cliente.includes(b.rut_remitente.substring(0,8))))
            );

            // Regla 2: Ventana de 3 días (Si es transferencia y coincide monto)
            if (!match && s.tipo_pago.toLowerCase().includes('transf')) {
                match = bank.find(b => {
                    const sDate = new Date(s.fecha_pago);
                    const bDate = new Date(b.fecha_banco);
                    const diffTime = bDate - sDate;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return b.monto === s.monto && diffDays >= 0 && diffDays <= 3;
                });
            }

            if (match) {
                // Ejecutar Conciliación en DB
                await pool.query('BEGIN');
                await pool.query(`UPDATE boxmagic_sales SET estado_conciliacion = 'CONCILIADO', comentario_auditoria = $1 WHERE id = $2`, [`Auto-Match robot 🤖 (BCI ID: ${match.id})`, s.id]);
                // Opcional: Marcar el pool bancario si tuviéramos esa columna
                await pool.query('COMMIT');
                matchedCount++;
            }
        }

        res.json({ message: `Triangulación completada. Se encontraron ${matchedCount} coincidencias automáticas para ${mes}.`, matchedCount });
    } catch (err) { 
        await pool.query('ROLLBACK');
        res.status(500).json({ error: err.message }); 
    }
});

// POST /api/boxmagic/conciliar → Enlaza un pago BoxMagic con un movimiento BCI y marca ambos
// POST /api/boxmagic/conciliar → Enlaza un pago BoxMagic con un movimiento BCI y marca ambos
app.post('/api/boxmagic/conciliar', async (req, res) => {
  try {
    const { boxmagic_id, bci_pool_id, sede } = req.body;
    // 1. Marcar el pago BoxMagic como conciliado
    await pool.query(`
      UPDATE boxmagic_sales 
      SET estado_conciliacion = 'CONCILIADO', bci_pool_id = $1, fecha_conciliacion = NOW()
      WHERE id = $2
    `, [bci_pool_id, boxmagic_id]);
    // 2. Atribuir sede al movimiento bancario
    await pool.query(`
      UPDATE bci_income_pool 
      SET estado_match = 'ENLAZADO', sede_atribuida = $1, conciliado_por = 'BOXMAGIC'
      WHERE id = $2
    `, [sede, bci_pool_id]);
    res.json({ message: 'Conciliacion exitosa', boxmagic_id, bci_pool_id, sede });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/boxmagic/audit/cash → Auditoría manual para Efectivo (Sin par en BCI)
app.post('/api/boxmagic/audit/cash', async (req, res) => {
  try {
    const { id } = req.body;
    const result = await pool.query(`
      UPDATE boxmagic_sales 
      SET estado_conciliacion = 'CONCILIADO', 
          comentario_auditoria = 'Auditado Manualmente (Efectivo por Usuario)', 
          fecha_conciliacion = NOW()
      WHERE id = $1 RETURNING *
    `, [id]);
    res.json({ message: 'Pago en efectivo auditado correctamente', data: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/conciliacion/ingresos/:mes → Pool BCI filtrado solo ingresos con atribución de sede
app.get('/api/conciliacion/ingresos/:mes', async (req, res) => {
  try {
    const { mes } = req.params;
    const mesToNum = { enero:'01',febrero:'02',marzo:'03',abril:'04',mayo:'05',junio:'06',julio:'07',agosto:'08',septiembre:'09',octubre:'10',noviembre:'11',diciembre:'12'};
    const num = mesToNum[req.params.mes.toLowerCase()] || '01';
    const dateFilter = `2026-${num}-%`;
    const result = await pool.query(`
      SELECT * FROM bci_income_pool 
      WHERE fecha_banco::text LIKE $1 AND monto > 0
      ORDER BY fecha_banco DESC
    `, [dateFilter]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/conciliacion/egresos_bci/:mes → Pool BCI filtrado solo egresos (cargos bancarios)
app.get('/api/conciliacion/egresos_bci/:mes', async (req, res) => {
  try {
    const mesToNum = { enero:'01',febrero:'02',marzo:'03',abril:'04',mayo:'05',junio:'06',julio:'07',agosto:'08',septiembre:'09',octubre:'10',noviembre:'11',diciembre:'12'};
    const num = mesToNum[req.params.mes.toLowerCase()] || '01';
    const dateFilter = `2026-${num}-%`;
    const result = await pool.query(`
      SELECT * FROM bci_income_pool 
      WHERE fecha_banco::text LIKE $1 AND monto < 0
      ORDER BY fecha_banco DESC
    `, [dateFilter]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// --- MODULO INGESTA (ELIMINANDO DEPENDENCIAS LOCALES) ---

// Auxiliares limpieza
const cleanAmt = (v) => { 
    if(v == null) return 0; 
    let str = String(v).replace(/[^0-9,-]/g, '').replace(',', '.'); 
    return Math.floor(parseFloat(str)) || 0; 
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

// 2. Ingesta BCI - SMART INGESTOR (Detecta Automáticamente Formato Formal/Resumen/Detallado)
const processBCIFile = async (filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    let count = 0, startIdx = -1, formatType = 'formal';

    // Detección de Formato
    for(let i=0; i<Math.min(rows.length, 30); i++){
        const line = JSON.stringify(rows[i]).toLowerCase();
        if(line.includes('fecha de transacci')){ formatType = 'detallado'; startIdx = i+1; break; }
        if(line.includes('fecha contable') && !line.includes('transacci')){ formatType = 'resumen'; startIdx = i+1; break; }
        if(line.includes('descripción')){ formatType = 'formal'; startIdx = i+1; break; }
    }

    if(startIdx === -1) startIdx = 0;

    for (let i = startIdx; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2) continue;

        let fechaVal, desc, monto, nombre_rem = null, rut_rem = null, glosa_ext = null;

        if (formatType === 'detallado') {
            // Estructura: Fecha(0), Glosa(7), Ingreso(8), Egreso(9), Nombre(11), RUT(12)
            fechaVal = row[0];
            desc = String(row[7] || '').toUpperCase();
            const ingreso = cleanAmt(row[8] || 0);
            const egreso = cleanAmt(row[9] || 0);
            monto = ingreso > 0 ? ingreso : -egreso;
            nombre_rem = row[11] ? String(row[11]).trim() : null;
            rut_rem = row[12] ? String(row[12]).trim() : null;
            glosa_ext = row[17] ? String(row[17]).trim() : null; // Comentario transferencia
        } else if (formatType === 'resumen') {
            // Estructura: Fecha(0), Desc(2), Egreso(3), Ingreso(4)
            fechaVal = row[0];
            desc = String(row[2] || '').toUpperCase();
            const egreso = cleanAmt(row[3] || 0);
            const ingreso = cleanAmt(row[4] || 0);
            monto = ingreso > 0 ? ingreso : -egreso;
        } else {
            // Estructura Formal: Fecha(0), Desc(5), Cargo(9), Abono(10)
            fechaVal = row[0];
            desc = String(row[5] || '').toUpperCase();
            const cargo = cleanAmt(row[9] || 0);
            const abono = cleanAmt(row[10] || 0);
            monto = abono > 0 ? abono : -cargo;
        }

        if (monto !== 0 && desc && !desc.includes('SALDO')) {
            const fechaStr = typeof fechaVal === 'number' ? new Date((fechaVal - 25569) * 86400 * 1000).toISOString().split('T')[0] : String(fechaVal).split('T')[0];
            const descNorm = desc.replace(/VIA INTERNET|EN LINEA|ONLINE|WWW\..*|TRANSFERENCIA|RECIBIDA|ENVIADA/g, '').trim();
            
            // Deduplicación basada en Monto, Fecha y fragmento de descripción
            const dupCheck = await pool.query(
                `SELECT id FROM bci_income_pool WHERE fecha_banco = $1 AND monto = $2 AND (nombre_banco LIKE $3 OR $4 LIKE '%' || nombre_banco || '%') LIMIT 1`,
                [fechaStr, monto, `%${descNorm.substring(0, 10)}%`, desc]
            );

            if (dupCheck.rows.length === 0) {
                const prefix = formatType === 'detallado' ? 'D' : (formatType === 'resumen' ? 'R' : 'M');
                const hashId = crypto.createHash('md5').update(`${prefix}-${fechaStr}-${descNorm}-${monto}`).digest('hex');
                await pool.query(
                    `INSERT INTO bci_income_pool (fecha_banco, monto, nombre_banco, nro_operacion, nombre_remitente, rut_remitente, glosa) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`, 
                    [fechaStr, monto, desc, hashId, nombre_rem, rut_rem, glosa_ext]
                );
                count++;
            }
        }
    }
    return count;
};

// 2. Ingesta BCI - CARTOLA MENSUAL CERRADA (Excel Formal)
app.post('/api/ingesta/bci/mensual', upload.single('file'), async (req, res) => {
    try {
        const count = await processBCIFile(req.file.path);
        fs.unlinkSync(req.file.path);
        res.json({ message: `Ingesta inteligente exitosa: ${count} movimientos registrados.`, count });
    } catch (err) { if(req.file) fs.unlinkSync(req.file.path); res.status(500).json({ error: err.message }); }
});

// 3. Ingesta BCI - MOVIMIENTOS RECIENTES (Excel Exportado Hoy)
app.post('/api/ingesta/bci/movimientos', upload.single('file'), async (req, res) => {
    try {
        const count = await processBCIFile(req.file.path);
        fs.unlinkSync(req.file.path);
        res.json({ message: `Ingesta inteligente exitosa: ${count} movimientos registrados.`, count });
    } catch (err) { if(req.file) fs.unlinkSync(req.file.path); res.status(500).json({ error: err.message }); }
});

// --- ESTADISTICAS PARA DASHBOARD ---
app.get('/api/stats/:mes', async (req, res) => {
    try {
        const { mes } = req.params;
        const mesToNum = { 'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08', 'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'};
        const num = mesToNum[mes.toLowerCase()] || '01';
        const dateFilter = `2026-${num}-%`;

        const bciIngRes = await pool.query(`SELECT SUM(monto) as total FROM bci_income_pool WHERE fecha_banco::text LIKE $1 AND monto > 0`, [dateFilter]);
        const bciEgrRes = await pool.query(`SELECT SUM(ABS(monto)) as total FROM bci_income_pool WHERE fecha_banco::text LIKE $1 AND monto < 0`, [dateFilter]);
        const vposBCIRes = await pool.query(`SELECT SUM(monto) as total FROM bci_income_pool WHERE fecha_banco::text LIKE $1 AND nombre_banco LIKE '%VIRTUALPOS%'`, [dateFilter]);
        const vposRealRes = await pool.query(`SELECT SUM(total_abono) as total FROM virtualpos_sales WHERE fecha::text LIKE $1`, [dateFilter]);
        const bmRes = await pool.query(`SELECT SUM(monto) as total FROM boxmagic_sales WHERE mes = $1`, [mes]);
        const egRes = await pool.query(`SELECT SUM(monto) as total FROM "Egreso" WHERE mes = $1`, [mes]);

        res.json({
            bci: { 
                abonos: parseInt(bciIngRes.rows[0].total) || 0, 
                egresos: parseInt(bciEgrRes.rows[0].total) || 0 
            },
            virtualpost: { 
                bci_recibido: parseInt(vposBCIRes.rows[0].total) || 0,
                vpos_teorico: parseInt(vposRealRes.rows[0].total) || 0
            },
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
