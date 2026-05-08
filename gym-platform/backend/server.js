const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const virtualPosService = require('./services/virtualposService');

// Configuracion de Email Transaccional
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  console.log(`[EMAIL] Intentando enviar correo a: ${to}...`);
  try {
    const info = await transporter.sendMail({
      from: `"The Boos Box" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });
    console.log(`[EMAIL] ✅ Enviado correctamente: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] ❌ Error crítico enviando a ${to}:`, error.message);
    if (error.message.includes('Invalid login')) {
        console.error('[EMAIL] ERROR DE AUTENTICACIÓN: Revisa que SMTP_PASS sea una "Contraseña de Aplicación" de Gmail.');
    }
    return false;
  }
};

const upload = multer({ dest: 'uploads/' });


const app = express();
const PORT = process.env.PORT || 3001;
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:Imagen30@localhost:5432/boos_erp_db",
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// SERVIR FRONTEND (PRODUCCION) - LÃ³gica de detecciÃ³n de rutas para Railway
let distPath = path.resolve(__dirname, '..', '..', 'dist');
if (!fs.existsSync(path.join(distPath, 'index.html'))) {
    distPath = path.resolve(__dirname, '..', 'dist'); // Intento 2
}
const indexPath = path.join(distPath, 'index.html');

console.log(`ðŸ“‚ Servidor configurado para servir dist desde: ${distPath}`);

// Middleware para servir archivos estÃ¡ticos
app.use(express.static(distPath));

// Ruta explÃ­cita para la Landing de Pago (Respaldo)
app.get('/pago/:id', (req, res) => {
  console.log(`ðŸŽ¯ Acceso a Landing de Pago para Socio: ${req.params.id}`);
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`Error: No se encontrÃ³ la interfaz de usuario. Ruta buscada: ${indexPath}`);
  }
});

app.get('/api/debug/path', (req, res) => {
  res.json({
    __dirname,
    distPath,
    indexPath,
    exists: fs.existsSync(indexPath),
    files_in_dist: fs.existsSync(distPath) ? fs.readdirSync(distPath) : 'dist not found'
  });
});

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
    
    // VerificaciÃ³n de Duplicados (Folio + RUT Proveedor)
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
        for(let i=0; i<rows.length; i++) {
            if(rows[i].some(c => String(c).toLowerCase().includes('ingreso'))) {
                startIdx = i + 1;
                break;
            }
        }
        if(startIdx === -1) startIdx = 0;

        for (let i = startIdx; i < rows.length; i++) {
            const row = rows[i];
            const desc = String(row[2] || '').toUpperCase();
            const monto = parseInt(row[4]) || 0;
            const fecha = row[0]; // Serial de Excel

            if (monto > 0) {
                const dateObj = new Date((fecha - 25569) * 86400 * 1000);
                const fechaStr = dateObj.toISOString().split('T')[0];
                const hashId = crypto.createHash('md5').update(`${fechaStr}-${desc}-${monto}`).digest('hex');

                await pool.query(
                    `INSERT INTO bci_income_pool (fecha_banco, monto, nombre_banco, nro_operacion) VALUES ($1, $2, $3, $4) ON CONFLICT (nro_operacion) DO NOTHING`,
                    [fechaStr, monto, desc, hashId]
                );
                count++;
            }
        }
        fs.unlinkSync(req.file.path);
        res.json({ message: `Ingesta de ${count} abonos BCI exitosa`, count });
    } catch (err) { res.status(500).json({ error: err.message }); }
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
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MÃ“DULO DE RECUPERACIÃ“N DE SOCIOS (MRS) â€” v1.0
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// GET /api/socios/inactivos â€” Bandeja del Ejecutivo de RetenciÃ³n
// Retorna socios inactivos ordenados por prioridad (ticket alto + menos dÃ­as = mÃ¡s urgente)
app.get('/api/socios/inactivos', async (req, res) => {
    const { sede, segmento, limit = 200, offset = 0 } = req.query;
    try {
        // Actualizar dias_inactivo y recalcular segmentos dinámicamente
        // REGLA: 'Alumnosfuga' = último pago en año 2024 (registros históricos importados)
        // Los demás segmentos se calculan por días de inactividad desde hoy
        await pool.query(`
            UPDATE socios SET
                dias_inactivo = GREATEST(0, (CURRENT_DATE - fecha_ultimo_pago::date)),
                segmento_riesgo = CASE
                    -- Alumnosfuga: SOLO alumnos cuyo último pago fue en el año 2024
                    WHEN EXTRACT(YEAR FROM fecha_ultimo_pago::date) = 2024 THEN 'Alumnosfuga'
                    WHEN (CURRENT_DATE - fecha_ultimo_pago::date) < 36  THEN 'Verde'
                    WHEN (CURRENT_DATE - fecha_ultimo_pago::date) < 60  THEN 'Amarillo'
                    WHEN (CURRENT_DATE - fecha_ultimo_pago::date) < 180 THEN 'Rojo'
                    WHEN (CURRENT_DATE - fecha_ultimo_pago::date) >= 180 THEN 'Critico'
                    ELSE 'Antiguo'
                END,
                estado = CASE
                    WHEN estado = 'Recuperado' THEN 'Recuperado'
                    WHEN (CURRENT_DATE - fecha_ultimo_pago::date) >= 30 THEN 'Inactivo'
                    ELSE 'Activo'
                END
            WHERE fecha_ultimo_pago IS NOT NULL
        `);

        // Filtrar socios inactivos
        let conditions = ["s.estado = 'Inactivo'"];
        const params = [];
        
        if (sede && sede.trim() !== '') {
            params.push(sede.trim());
            conditions.push(`LOWER(s.sede_habitual) = LOWER($${params.length})`);
        }
        if (segmento && segmento.trim() !== '') {
            params.push(segmento.trim());
            conditions.push(`s.segmento_riesgo = $${params.length}`);
            // Si es Alumnosfuga, filtrar ESTRICTAMENTE por año 2024
            if (segmento.trim() === 'Alumnosfuga') {
                conditions.push(`EXTRACT(YEAR FROM s.fecha_ultimo_pago::date) = 2024`);
            }
        }
        
        params.push(parseInt(limit));
        params.push(parseInt(offset));
        
        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        
        const result = await pool.query(`
            SELECT 
                s.id,
                s.nombre,
                s.email,
                s.*,
                (
                    SELECT json_agg(h ORDER BY h.fecha_contacto DESC)
                    FROM campanas_recuperacion h
                    WHERE h.socio_id = s.id
                ) as historial,
                CASE 
                    WHEN s.telefono IS NOT NULL THEN 
                        'https://wa.me/' || REGEXP_REPLACE(s.telefono, '\\D', '', 'g') || 
                        '?text=' || ENCODE(('Hola ' || SPLIT_PART(s.nombre, ' ', 1) || 
                        ', soy de The Boos Box! 🥊 Te extrañamos. ' ||
                        'Tenemos tu *Pack de Reactivación*: 4 clases por solo $27.000. ' ||
                        '¿Te apunto para esta semana?')::BYTEA, 'escape')
                    ELSE NULL
                END AS whatsapp_link
            FROM socios s
            ${whereClause}
            ORDER BY 
                CASE s.segmento_riesgo
                    WHEN 'Amarillo' THEN 1
                    WHEN 'Rojo'     THEN 2
                    WHEN 'Critico'  THEN 3
                    WHEN 'Alumnosfuga' THEN 4
                    WHEN 'Antiguo'  THEN 5
                    ELSE 6
                END ASC,
                s.monto_promedio DESC
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `, params);
        
        // Total para paginaciÃ³n
        const totalResult = await pool.query(`
            SELECT COUNT(*) FROM socios s ${whereClause}
        `, params.slice(0, -2));
        
        res.json({
            socios: result.rows,
            total: parseInt(totalResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (err) {
        console.error('[MRS] Error en /api/socios/inactivos:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/socios/stats â€” KPIs del MÃ³dulo de RecuperaciÃ³n
app.get('/api/socios/stats', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                COUNT(*) FILTER (WHERE estado = 'Inactivo') AS total_inactivos,
                COUNT(*) FILTER (WHERE estado = 'Activo') AS total_activos,
                COUNT(*) FILTER (WHERE estado = 'Recuperado') AS total_recuperados,
                COUNT(*) FILTER (WHERE segmento_riesgo = 'Amarillo' AND estado = 'Inactivo') AS seg_amarillo,
                COUNT(*) FILTER (WHERE segmento_riesgo = 'Rojo'     AND estado = 'Inactivo') AS seg_rojo,
                COUNT(*) FILTER (WHERE segmento_riesgo = 'Critico'  AND estado = 'Inactivo') AS seg_critico,
                COALESCE(SUM(monto_promedio) FILTER (WHERE estado = 'Inactivo'), 0) AS potencial_bruto,
                COALESCE(AVG(monto_promedio) FILTER (WHERE estado != 'Activo'), 0)::INTEGER AS ticket_promedio
            FROM socios
        `);
        
        const campanas = await pool.query(`
            SELECT
                COUNT(*) FILTER (WHERE resultado = 'ReingresÃ³') AS conversiones,
                COALESCE(SUM(monto_recuperado), 0) AS monto_total_recuperado,
                COUNT(*) AS total_contactos
            FROM campanas_recuperacion
            WHERE DATE_TRUNC('month', fecha_contacto) = DATE_TRUNC('month', NOW())
        `);
        
        const stats = result.rows[0];
        const kpi = campanas.rows[0];
        
        res.json({
            socios: {
                activos:       parseInt(stats.total_activos),
                inactivos:     parseInt(stats.total_inactivos),
                recuperados:   parseInt(stats.total_recuperados),
                seg_amarillo:  parseInt(stats.seg_amarillo),
                seg_rojo:      parseInt(stats.seg_rojo),
                seg_critico:   parseInt(stats.seg_critico),
                potencial_recuperacion: Math.round(parseInt(stats.potencial_bruto) * 0.20),
                ticket_promedio: parseInt(stats.ticket_promedio),
            },
            campana_mes: {
                contactos:          parseInt(kpi.total_contactos),
                conversiones:       parseInt(kpi.conversiones),
                monto_recuperado:   parseInt(kpi.monto_total_recuperado),
                tasa_conversion:    kpi.total_contactos > 0 
                    ? Math.round((kpi.conversiones / kpi.total_contactos) * 100)
                    : 0
            }
        });
    } catch (err) {
        console.error('[MRS] Error en /api/socios/stats:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/campanas â€” Registrar un contacto de recuperaciÃ³n
app.post('/api/campanas', async (req, res) => {
    const { socio_id, tipo_contacto, promo_ofrecida, agente_nombre, estado_gestion, resultado } = req.body;
    if (!socio_id) return res.status(400).json({ error: 'socio_id requerido' });
    try {
        const result = await pool.query(`
            INSERT INTO campanas_recuperacion 
                (socio_id, tipo_contacto, promo_ofrecida, agente_nombre, estado_gestion, resultado, fecha_respuesta)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [
            socio_id,
            tipo_contacto || 'WhatsApp',
            promo_ofrecida || '4 clases x $19.000 Pack ReactivaciÃ³n',
            agente_nombre || 'Ejecutivo',
            estado_gestion || 'Contactado',
            resultado || null,
            (resultado || estado_gestion) === 'ReingresÃ³' ? new Date() : null
        ]);

        // Si el resultado o estado es 'ReingresÃ³', actualizar estado del socio inmediatamente
        if (resultado === 'ReingresÃ³' || estado_gestion === 'ReingresÃ³') {
            await pool.query(`
                UPDATE socios SET estado = 'Recuperado', updated_at = NOW()
                WHERE id = $1
            `, [socio_id]);

            // PASO 2: NotificaciÃ³n de ActivaciÃ³n Final
            const socioRes = await pool.query('SELECT nombre, email FROM socios WHERE id = $1', [socio_id]);
            if (socioRes.rows.length > 0) {
                const s = socioRes.rows[0];
                const html = `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                        <div style="background: #ff0000; color: #fff; padding: 30px; text-align: center;">
                            <h1 style="margin: 0;">Â¡BIENVENIDO DE VUELTA! ðŸ¥Š</h1>
                        </div>
                        <div style="padding: 30px; color: #333;">
                            <p>Hola <strong>${s.nombre.split(' ')[0]}</strong>,</p>
                            <p>Â¡Excelentes noticias! Hemos verificado tu pago y tu plan ya se encuentra <strong>ACTIVO</strong>.</p>
                            <p>Ya puedes entrar a la App <strong>BoxMagic</strong> y reservar tus clases normalmente.</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="https://app.boxmagic.cl" style="background: #000; color: #fff; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">IR A BOXMAGIC</a>
                            </div>
                            <p style="font-size: 12px; color: #999;">Nos vemos en el Box.</p>
                        </div>
                    </div>
                `;
                sendEmail(s.email, "Â¡Plan Activado! Ya puedes entrenar ðŸ¥Š", html);
            }
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('[MRS] Error en POST /api/campanas:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/campanas/:id â€” Actualizar resultado de gestiÃ³n
app.put('/api/campanas/:id', async (req, res) => {
    const { id } = req.params;
    const { estado_gestion, resultado, respuesta, monto_recuperado } = req.body;
    try {
        const result = await pool.query(`
            UPDATE campanas_recuperacion SET
                estado_gestion   = COALESCE($1, estado_gestion),
                resultado        = COALESCE($2, resultado),
                respuesta        = COALESCE($3, respuesta),
                monto_recuperado = COALESCE($4, monto_recuperado),
                fecha_respuesta  = CASE WHEN $1 IS NOT NULL THEN NOW() ELSE fecha_respuesta END
            WHERE id = $5
            RETURNING *
        `, [estado_gestion, resultado, respuesta, monto_recuperado, id]);
        
        // Si el resultado es 'ReingresÃ³', actualizar estado del socio
        if (resultado === 'ReingresÃ³' && result.rows.length > 0) {
            await pool.query(`
                UPDATE socios SET estado = 'Recuperado', updated_at = NOW()
                WHERE id = $1
            `, [result.rows[0].socio_id]);
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('[MRS] Error en PUT /api/campanas/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/campanas/email — Enviar email de promoción automático
app.post('/api/campanas/email', async (req, res) => {
    const { socio_id } = req.body;
    try {
        const socioRes = await pool.query('SELECT * FROM socios WHERE id = $1', [socio_id]);
        if (socioRes.rows.length === 0) return res.status(404).json({ error: 'Socio no encontrado' });
        
        const s = socioRes.rows[0];
        const linkPago = `https://techboos-production-edd2.up.railway.app/pago/${s.id}`;
        
        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; background: #000;">
                <div style="padding: 40px; text-align: center;">
                    <h1 style="color: #f59e0b; font-size: 28px; margin: 0; letter-spacing: 2px;">THE BOOS BOX</h1>
                    <p style="color: #64748b; font-size: 12px; text-transform: uppercase;">Módulo de Recuperación · Sede Campanario</p>
                </div>
                <div style="padding: 40px; background: #fff; color: #333;">
                    <h2 style="margin-top: 0;">¡Hola ${s.nombre.split(' ')[0]}! Te extrañamos en el Box.</h2>
                    <p>Hace tiempo que no te vemos en la arena y queremos que vuelvas a entrenar con nosotros.</p>
                    <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #e2e8f0;">
                        <h3 style="margin-top: 0; color: #f59e0b;">PROMO EXCLUSIVA: PACK RESCUE</h3>
                        <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">$27.000 <span style="font-size: 14px; text-decoration: line-through; color: #94a3b8;">$39.900</span></p>
                        <ul style="padding-left: 20px; font-size: 14px;">
                            <li>4 Clases de Crossfit / Funcional</li>
                            <li>Válido para Sede Campanario</li>
                            <li>Activación inmediata post-pago</li>
                        </ul>
                    </div>
                    <div style="text-align: center;">
                        <a href="${linkPago}" style="background: #000; color: #fff; padding: 18px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">RECLAMAR MI PACK AHORA</a>
                    </div>
                </div>
                <div style="padding: 20px; text-align: center; color: #475569; font-size: 11px;">
                    The Boos Box SpA — Infraestructura Múltiple Protegida
                </div>
            </div>
        `;

        // Verificar que SMTP esté configurado antes de intentar
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.error('[EMAIL] ❌ Variables SMTP_USER y/o SMTP_PASS no configuradas en Railway');
            return res.status(500).json({ error: 'Servidor de correo no configurado. Contacta al administrador.' });
        }

        const enviado = await sendEmail(s.email, "🥊 ¡Regresa a The Boos Box! Tenemos un regalo para ti", html);
        
        if (!enviado) {
            return res.status(500).json({ 
                error: `No se pudo enviar el correo a ${s.email}. Revisa los logs del servidor o verifica la Contraseña de Aplicación de Gmail en las variables de entorno de Railway.` 
            });
        }

        // Registrar la gestión en el historial SOLO si el email fue exitoso
        await pool.query(`
            INSERT INTO campanas_recuperacion (socio_id, tipo_contacto, estado_gestion, promo_ofrecida)
            VALUES ($1, 'Email Auto', 'Contactado', 'Pack Rescue $27k')
        `, [socio_id]);

        res.json({ success: true, mensaje: `Email enviado correctamente a ${s.email}` });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/socios/:id/notas â€” Actualizar notas del socio
app.put('/api/socios/:id/notas', async (req, res) => {
    const { id } = req.params;
    const { notas, instagram } = req.body;
    try {
        const result = await pool.query(`
            UPDATE socios SET
                notas      = COALESCE($1, notas),
                instagram  = COALESCE($2, instagram),
                updated_at = NOW()
            WHERE id = $3 RETURNING id, nombre, notas, instagram
        `, [notas, instagram, id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/pago/:id â€” Obtener datos para la landing de pago (PÃºblico)
app.get('/api/pago/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT nombre, email, sede_habitual FROM socios WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Link no vÃ¡lido' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/pago/:id/comprobante â€” Registrar intenciÃ³n de pago o subida de foto
app.post('/api/pago/:id/comprobante', async (req, res) => {
    const { metodo, monto, comprobante } = req.body;
    try {
        await pool.query(`
            INSERT INTO campanas_recuperacion (socio_id, tipo_contacto, estado_gestion, respuesta, evidencia_pago)
            VALUES ($1, $2, 'Interesado', $3, $4)
        `, [req.params.id, 'Landing Pago', `IntenciÃ³n de pago via ${metodo} por $${monto}`, comprobante]);

        // PASO 1: NotificaciÃ³n de Recibo
        const socioRes = await pool.query('SELECT nombre, email FROM socios WHERE id = $1', [req.params.id]);
        if (socioRes.rows.length > 0) {
            const s = socioRes.rows[0];
            const html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                    <div style="background: #000; color: #fff; padding: 30px; text-align: center;">
                        <h1 style="margin: 0; color: #ff0000;">REGISTRO RECIBIDO âœ…</h1>
                    </div>
                    <div style="padding: 30px; color: #333;">
                        <p>Hola <strong>${s.nombre.split(' ')[0]}</strong>,</p>
                        <p>Hemos recibido correctamente tu comprobante de pago por el <strong>Pack de ReactivaciÃ³n</strong>.</p>
                        <p>Tu ticket de seguimiento es: <strong>TBB-${req.params.id.substring(0,5).toUpperCase()}</strong></p>
                        <p>Nuestro equipo validarÃ¡ la transacciÃ³n en un plazo de <strong>2 a 4 horas hÃ¡biles</strong>. Te avisaremos por este mismo medio cuando tus clases estÃ©n habilitadas.</p>
                        <p style="font-size: 12px; color: #999;">The Boos Box ERP - Sistema de Pago Seguro</p>
                    </div>
                </div>
            `;
            sendEmail(s.email, "Hemos recibido tu comprobante (The Boos Box)", html);
        }

        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FIN MÃ“DULO MRS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// ComodÃ­n para SPA (React Router fallback) - VersiÃ³n Regex Literal (Seguro para Express 5)
app.get(/.*/, (req, res) => {
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ error: `API Route ${req.url} not found` });
  }
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Error de despliegue: No se encuentra index.html");
  }
});

// ==========================================
// MÃ“DULO VIRTUALPOS - PAGOS AUTOMATIZADOS
// ==========================================

// Endpoint para crear link de pago (Boos Rescue)
app.post('/api/payments/create-link', async (req, res) => {
  const { socioId, amount, description, sede } = req.body;
  console.log(`[PAYMENT] Iniciando cobro de $${amount} para Socio ID: ${socioId} (${sede || 'General'})`);
  try {
    const socioRes = await pool.query('SELECT * FROM socios WHERE id = $1', [socioId]);
    if (socioRes.rows.length === 0) {
        console.error(`[PAYMENT] Socio ${socioId} no encontrado en DB`);
        return res.status(404).json({ error: 'Socio no encontrado' });
    }
    
    const socio = socioRes.rows[0];
    const finalDescription = `${description} (${sede || 'General'})`;
    
    const payment = await virtualPosService.createPayment(amount, finalDescription, socio.email, socio.nombre);
    
    // Guardar el UUID del pago en el socio para seguimiento
    await pool.query('UPDATE socios SET vpos_uuid = $1, updated_at = NOW() WHERE id = $2', [payment.uuid, socioId]);
    
    console.log(`[PAYMENT] Link generado exitosamente: ${payment.web_checkout_url}`);
    res.json({ url: payment.web_checkout_url, uuid: payment.uuid });
  } catch (error) {
    console.error('[PAYMENT] Error crítico:', error.message);
    res.status(500).json({ error: 'Error al generar link de pago: ' + error.message });
  }
});

// WEBHOOK de VirtualPos (Recibe notificaciones de pago)
app.post('/api/payments/webhook', async (req, res) => {
  const { uuid } = req.body;
  console.log(`ðŸ”” Webhook recibido de VirtualPos para el pago: ${uuid}`);

  try {
    // Validar el estado real con VirtualPos (Seguridad adicional)
    const paymentDetail = await virtualPosService.getPaymentStatus(uuid);
    
    if (paymentDetail.status === 'paid' || paymentDetail.status === 'approved') {
      const socioRes = await pool.query('SELECT * FROM socios WHERE vpos_uuid = $1', [uuid]);
      if (socioRes.rows.length > 0) {
        const socio = socioRes.rows[0];
        
        // MARCAR COMO RECUPERADO
        await pool.query("UPDATE socios SET estado = 'Recuperado', segmento_riesgo = 'Limpio', updated_at = NOW() WHERE vpos_uuid = $1", [uuid]);
        
        console.log(`âœ… Socio recuperado automÃ¡ticamente: ${socio.nombre}`);
        
        // Enviar email de bienvenida
        await sendEmail(socio.email, "Â¡Bienvenido de vuelta a The Boos Box! ðŸ¥Š", `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <h2 style="color: #1a1f2e; text-align: center;">Â¡Pago Confirmado!</h2>
            <p>Hola <strong>${socio.nombre}</strong>,</p>
            <p>Estamos muy felices de confirmarte que tu pago para el <strong>Pack Boos Rescue</strong> ha sido procesado exitosamente.</p>
            <p style="background: #f8fafc; padding: 15px; border-left: 4px solid #10b981;">
              <strong>PrÃ³ximo paso:</strong> Te esperamos en tu sede habitual para tu primera clase. Â¡Dale con todo!
            </p>
            <p style="text-align: center; color: #64748b; font-size: 0.9em; margin-top: 30px;">
              The Boos Box â€” Infraestructura MÃºltiple Protegida
            </p>
          </div>
        `);
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('âŒ Error en el procesamiento del Webhook:', error);
    res.sendStatus(500);
  }
});

// ==========================================
// MÓDULO SERVICIOS COMPLEMENTARIOS (KINE/NUTRI)
// ==========================================

// GET /api/servicios/profesionales
app.get('/api/servicios/profesionales', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM profesionales WHERE activo = true');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/servicios/sesiones
app.get('/api/servicios/sesiones', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, p.nombre as profesional_nombre 
      FROM sesiones_servicios s
      JOIN profesionales p ON s.profesional_id = p.id
      ORDER BY s.fecha_sesion DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/servicios/sesiones
app.post('/api/servicios/sesiones', async (req, res) => {
  const { profesional_id, socio_nombre, monto_total } = req.body;
  const monto_box = 5000;
  const monto_profesional = monto_total - monto_box;

  try {
    const result = await pool.query(`
      INSERT INTO sesiones_servicios (profesional_id, socio_nombre, monto_total, monto_box, monto_profesional)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [profesional_id, socio_nombre, monto_total, monto_box, monto_profesional]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// MANEJO DE RUTAS SPA (DEBE IR AL FINAL)
app.get(/^(?!\/api).*$/, (req, res) => {
    res.sendFile(indexPath);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor ERP Boos Cloud corriendo en puerto ${PORT}`);
});
