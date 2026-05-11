const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
// Resend se importa de forma lazy dentro de sendEmail() para evitar crash al arrancar
const cron = require('node-cron');
const virtualPosService = require('./services/virtualposService');

// ==========================================
// 1. CONFIGURACIÓN E INICIALIZACIÓN CORE
// ==========================================
const app = express();
const PORT = process.env.PORT || 3001;

// Base de Datos
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:Imagen30@localhost:5432/boos_erp_db",
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Email (inicialización lazy - NO se instancia aquí para evitar crash si falta la variable)
const upload = multer({ dest: 'uploads/' });

// Middlewares Globales
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ==========================================
// 2. FUNCIONES AUXILIARES
// ==========================================
const sendEmail = async (to, subject, html) => {
  console.log(`[EMAIL] Intentando enviar correo a: ${to}...`);
  try {
    const apiKey = 're_3vqgZdWo_K8ZcTvyKqLdejdYiV8mkEtgk';
    // Inicialización lazy
    const { Resend: ResendClient } = require('resend');
    const resendInstance = new ResendClient(apiKey);
    const { data, error } = await resendInstance.emails.send({
      from: 'The Boos Box <onboarding@resend.dev>',
      to,
      subject,
      html
    });
    if (error) throw new Error(error.message);
    console.log(`[EMAIL] ✅ Enviado correctamente. ID: ${data.id}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] ❌ Error crítico enviando a ${to}:`, error.message);
    return false;
  }
};

// Función para enviar alertas por Telegram
async function sendTelegramMessage(text) {
  const token = '8445378549:AAEKUyEmsRj1t7STKq1yn6FIlybg18dfNzk';
  const chatId = '8674219703';
  try {
    const https = require('https');
    const data = JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'Markdown' });
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
    };
    const req = https.request(options);
    req.write(data);
    req.end();
    console.log('✅ Alerta de Telegram enviada');
  } catch (err) {
    console.error('❌ Error enviando Telegram:', err.message);
  }
}

const cleanAmt = (v) => {
    if(!v) return 0;
    const s = String(v).replace(/\$|\.|\s/g, '').replace(',', '.');
    return parseInt(parseFloat(s)) || 0;
};

// ==========================================
// 3. TAREAS PROGRAMADAS (CRON)
// ==========================================
cron.schedule('0 2 * * *', async () => {
    console.log('[CRON] 🌙 Iniciando despacho nocturno personalizado...');
    try {
        const pendientes = await pool.query(`
            SELECT c.*, s.nombre, s.email, s.id as socio_uuid
            FROM cola_emails c
            JOIN socios s ON c.socio_id = s.id
            WHERE c.estado = 'Pendiente'
        `);

        for (const job of pendientes.rows) {
            const primerNombre = job.nombre.split(' ')[0];
            const linkPago = `https://techboos-production-edd2.up.railway.app/pago/${job.socio_uuid}`;
            const html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; background: #000;">
                    <div style="padding: 40px; text-align: center;">
                        <h1 style="color: #f59e0b; font-size: 28px; margin: 0; letter-spacing: 2px;">THE BOOS BOX</h1>
                    </div>
                    <div style="padding: 40px; background: #fff; color: #333;">
                        <h2>¡Hola ${primerNombre}! 👋</h2>
                        <p>Hace tiempo que no te vemos en el Box y la comunidad extraña tu energía. Sabemos que quieres retomar tus entrenamientos y que solo estás esperando el momento ideal para hacerlo. ¡Ese momento es ahora!</p>
                        <p>Vuelve con nuestra promoción exclusiva y reincorpórate con todo a <strong>The Boos Box</strong>:</p>
                        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0; text-align: center;">
                            <h3 style="color: #f59e0b; text-transform: uppercase; letter-spacing: 1px;">PACK REINCORPORACIÓN</h3>
                            <p style="font-size: 32px; font-weight: 900; margin: 10px 0;">$19.900</p>
                            <p style="font-size: 13px; color: #64748b;">(4 Clases de Crossfit / Funcional)</p>
                        </div>
                        <div style="text-align: center;">
                            <a href="${linkPago}" style="background: #000; color: #fff; padding: 18px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">RECLAMAR MI LUGAR AHORA</a>
                        </div>
                    </div>
                </div>
            `;
            const enviado = await sendEmail(job.email, `🥊 ¡Te extrañamos, ${primerNombre}!`, html);
            if (enviado) {
                await pool.query("UPDATE cola_emails SET estado = 'Enviado', fecha_envio_programado = NOW() WHERE id = $1", [job.id]);
                await pool.query("INSERT INTO campanas_recuperacion (socio_id, tipo_contacto, estado_gestion, promo_ofrecida) VALUES ($1, 'Email Nocturno', 'Contactado', 'Pack Rescue $19.9k')", [job.socio_uuid]);
            }
        }
    } catch (err) { console.error('[CRON] Error:', err.message); }
}, { timezone: "America/Santiago" });

// ==========================================
// 4. ENDPOINTS API - FINANZAS Y NOMINAS
// ==========================================
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
    const existe = await pool.query('SELECT id FROM "FacturaCompra" WHERE folio = $1 AND rut = $2 LIMIT 1', [folio, rut]);
    if (existe.rows.length > 0) return res.status(200).json({ message: "Factura ya ingresada previamente", data: existe.rows[0] });
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

// ==========================================
// 5. ENDPOINTS API - RECUPERACION Y CRM
// ==========================================
app.get('/api/socios/inactivos', async (req, res) => {
    const { sede, segmento, limit = 200, offset = 0 } = req.query;
    try {
        await pool.query(`
            UPDATE socios SET
                dias_inactivo = GREATEST(0, (CURRENT_DATE - fecha_ultimo_pago::date)),
                segmento_riesgo = CASE
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

        let conditions = ["s.estado = 'Inactivo'"];
        const params = [];
        if (sede && sede.trim() !== '') {
            params.push(sede.trim());
            conditions.push(`(LOWER(s.sede_habitual) = LOWER($${params.length}) OR s.sede_habitual IS NULL OR s.sede_habitual = 'Desconocida')`);
        }
        if (segmento && segmento.trim() !== '') {
            params.push(segmento.trim());
            conditions.push(`s.segmento_riesgo = $${params.length}`);
        }
        params.push(parseInt(limit));
        params.push(parseInt(offset));
        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const result = await pool.query(`
            SELECT s.*, (SELECT json_agg(h ORDER BY h.fecha_contacto DESC) FROM campanas_recuperacion h WHERE h.socio_id = s.id) as historial
            FROM socios s ${whereClause}
            ORDER BY CASE s.segmento_riesgo WHEN 'Amarillo' THEN 1 WHEN 'Rojo' THEN 2 WHEN 'Critico' THEN 3 WHEN 'Alumnosfuga' THEN 4 ELSE 5 END ASC, s.monto_promedio DESC
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `, params);
        const totalResult = await pool.query(`SELECT COUNT(*) FROM socios s ${whereClause}`, params.slice(0, -2));
        res.json({ socios: result.rows, total: parseInt(totalResult.rows[0].count), limit: parseInt(limit), offset: parseInt(offset) });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/socios/stats', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                COUNT(*) FILTER (WHERE estado = 'Inactivo') AS total_inactivos,
                COUNT(*) FILTER (WHERE estado = 'Activo') AS total_activos,
                COUNT(*) FILTER (WHERE estado = 'Recuperado') AS total_recuperados,
                COALESCE(SUM(monto_promedio) FILTER (WHERE estado = 'Inactivo'), 0) AS potencial_bruto
            FROM socios
        `);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/campanas/encolar', async (req, res) => {
    const { socio_id } = req.body;
    try {
        await pool.query("INSERT INTO cola_emails (socio_id, estado) VALUES ($1, 'Pendiente')", [socio_id]);
        res.json({ success: true, mensaje: 'Encolado exitosamente' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

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
                </div>
                <div style="padding: 40px; background: #fff; color: #333;">
                    <h2 style="margin-top: 0;">¡Hola ${s.nombre.split(' ')[0]}! 👋</h2>
                    <p style="font-size: 16px; line-height: 1.6;">Hace tiempo que no te vemos en el Box y la comunidad extraña tu energía. Sabemos que quieres retomar tus entrenamientos y que solo estás esperando el momento ideal para hacerlo.</p>
                    <p style="font-size: 16px; line-height: 1.6; font-weight: bold;">¡Ese momento es ahora! Vuelve con nuestra promoción exclusiva y reincorpórate con todo a <strong>The Boos Box</strong>:</p>
                    
                    <div style="background: #f8fafc; padding: 25px; border-radius: 16px; margin: 24px 0; border: 1px solid #e2e8f0; text-align: center;">
                        <h3 style="color: #f59e0b; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0; font-size: 14px;">PACK REINCORPORACIÓN</h3>
                        <p style="font-size: 48px; font-weight: 900; margin: 0; color: #000;">$19.900</p>
                        <p style="font-size: 14px; color: #64748b; margin: 10px 0 0 0;">(4 Clases de Crossfit / Funcional)</p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 32px;">
                        <a href="${linkPago}" style="background: #000; color: #fff; padding: 20px 32px; text-decoration: none; border-radius: 10px; font-weight: 900; display: inline-block; font-size: 16px; letter-spacing: 1px;">RECLAMAR MI LUGAR AHORA</a>
                    </div>
                </div>
                <div style="padding: 20px; background: #f9fafb; text-align: center; border-top: 1px solid #eee;">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">The Boos Box SpA · Sede Campanario</p>
                </div>
            </div>
        `;
        const enviado = await sendEmail(s.email, "🥊 ¡Regresa a The Boos Box!", html);
        if (enviado) {
            await pool.query("INSERT INTO campanas_recuperacion (socio_id, tipo_contacto, estado_gestion, promo_ofrecida) VALUES ($1, 'Email Auto', 'Contactado', 'Pack Rescue $19.9k')", [socio_id]);
            res.json({ success: true });
        } else res.status(500).json({ error: 'Error al enviar email' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/pago/:id — Obtener datos para la landing de pago (Público)
app.get('/api/pago/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT nombre, email, sede_habitual FROM socios WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Link no válido' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/pagos/comprobante — Recibir comprobante de transferencia y notificar al admin
app.post('/api/pagos/comprobante', upload.single('comprobante'), async (req, res) => {
    const { socioId, nombre, email, emailConfirm, telefono } = req.body;
    const telefonoLimpio = (telefono || '').replace(/\s+/g, '').replace('+', '');
    
    try {
        // 1. PRIORIDAD: Registrar en la BD para que no se pierda la venta
        await pool.query(
            "INSERT INTO campanas_recuperacion (socio_id, tipo_contacto, estado_gestion, promo_ofrecida) VALUES ($1, 'Transferencia', 'Pendiente Validación', 'Pack Reincorporación $19.900')",
            [socioId]
        );

        // 2. Responder al alumno de inmediato para que no se quede pegado el botón
        res.json({ success: true, mensaje: 'Comprobante recibido exitosamente.' });

        // 3. SEGUNDO PLANO: Notificar al admin vía RESEND (Garantizado)
        (async () => {
            try {
                const { Resend } = require('resend');
                const resend = new Resend('re_3vqgZdWo_K8ZcTvyKqLdejdYiV8mkEtgk');
                
                // Nota: Mientras no validemos dominio, enviamos desde onboarding@resend.dev
                const { data, error } = await resend.emails.send({
                    from: 'The Boos Box ERP <onboarding@resend.dev>',
                    to: 'contactoboosbox@gmail.com',
                    subject: `🏦 NUEVO PAGO — ${nombre} — $19.900`,
                    html: `
                        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;border:1px solid #eee;border-radius:12px;padding:24px;">
                            <h2 style="color:#10b981;">✅ Nuevo Pago Recibido</h2>
                            <p><strong>Alumno:</strong> ${nombre}</p>
                            <p><strong>Email Confirmado:</strong> ${emailConfirm || email}</p>
                            <p><strong>WhatsApp:</strong> ${telefono || 'No ingresado'}</p>
                            <hr/>
                            <p>👉 Activa el plan en BoxMagic y avísale por WhatsApp.</p>
                            <a href="https://wa.me/${telefonoLimpio}" style="background:#25D366;color:#fff;padding:12px 20px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">📱 Abrir WhatsApp</a>
                        </div>
                    `
                });

                if (error) throw error;
                console.log(`✅ Notificación enviada vía Resend para ${nombre}`);

                // 4. ALERTA TELEGRAM: Aviso instantáneo al móvil (Formato Markdown para mayor compatibilidad)
                const msjTelegram = `🔔 *NUEVA TRANSFERENCIA*\n\n👤 *Alumno:* ${nombre}\n📧 *Email:* ${emailConfirm || email}\n📱 *WhatsApp:* ${telefono || 'No entregado'}\n\n👉 https://wa.me/${telefonoLimpio}`;
                await sendTelegramMessage(msjTelegram);

            } catch (mailErr) {
                console.error('⚠️ Error en Resend Notification:', mailErr.message);
            } finally {
                if (req.file) {
                    const fs = require('fs');
                    try { fs.unlinkSync(req.file.path); } catch(e) {}
                }
            }
        })();

    } catch (err) {
        console.error('❌ Error crítico en comprobante:', err.message);
        if (!res.headersSent) res.status(500).json({ error: 'Error al registrar el pago' });
    }
});

// ==========================================
// 6. ENDPOINTS API - INGESTA Y CONCILIACION
// ==========================================
app.post('/api/ingesta/boxmagic', upload.single('file'), async (req, res) => {
    try {
        const { sede, mes } = req.body;
        const workbook = xlsx.readFile(req.file.path);
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        let count = 0;
        for (const row of data) {
            const monto = cleanAmt(row['Monto']);
            if (monto > 0) {
                await pool.query(`INSERT INTO boxmagic_sales (fecha_pago, cliente, monto, tipo_pago, vendedor, sede, mes) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [row['Fecha'] || row['Fecha de pago'], row['Cliente'], monto, row['Tipo'], row['Vendedor/a'], sede, mes]);
                count++;
            }
        }
        fs.unlinkSync(req.file.path);
        res.json({ message: `Ingesta exitosa`, count });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 7. MODULO KINE/NUTRI
// ==========================================
app.get('/api/servicios/profesionales', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM profesionales WHERE activo = true');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/servicios/sesiones', async (req, res) => {
  const { profesional_id, socio_nombre, monto_total } = req.body;
  try {
    const result = await pool.query(`INSERT INTO sesiones_servicios (profesional_id, socio_nombre, monto_total, monto_box, monto_profesional) VALUES ($1, $2, $3, $4, $5) RETURNING *`, [profesional_id, socio_nombre, monto_total, 5000, monto_total - 5000]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 8. MÓDULO VIRTUALPOS - PAGOS AUTOMATIZADOS
// ==========================================
app.post('/api/payments/create-link', async (req, res) => {
  const { socioId, amount, description, sede } = req.body;
  try {
    const socioRes = await pool.query('SELECT * FROM socios WHERE id = $1', [socioId]);
    if (socioRes.rows.length === 0) return res.status(404).json({ error: 'Socio no encontrado' });
    const socio = socioRes.rows[0];
    const payment = await virtualPosService.createPayment(amount, description, socio.email, socio.nombre);
    await pool.query('UPDATE socios SET vpos_uuid = $1, updated_at = NOW() WHERE id = $2', [payment.uuid, socioId]);
    res.json({ url: payment.web_checkout_url, uuid: payment.uuid });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/payments/webhook', async (req, res) => {
  const { uuid } = req.body;
  try {
    const paymentDetail = await virtualPosService.getPaymentStatus(uuid);
    if (paymentDetail.status === 'paid' || paymentDetail.status === 'approved') {
      await pool.query("UPDATE socios SET estado = 'Recuperado', updated_at = NOW() WHERE vpos_uuid = $1", [uuid]);
      // Enviar email de bienvenida (Opcional)
    }
    res.sendStatus(200);
  } catch (error) { res.sendStatus(500); }
});

// ==========================================
// 8. SERVIDO DE FRONTEND Y SPA
// ==========================================
let distPath = path.resolve(__dirname, '..', '..', 'dist');
if (!fs.existsSync(path.join(distPath, 'index.html'))) distPath = path.resolve(__dirname, '..', 'dist');
const indexPath = path.join(distPath, 'index.html');

app.use(express.static(distPath));
app.get('/pago/:id', (req, res) => res.sendFile(indexPath));
app.get('/api/debug/path', (req, res) => res.json({ __dirname, distPath, indexPath, exists: fs.existsSync(indexPath) }));
app.get(/^(?!\/api).*$/, (req, res) => res.sendFile(indexPath));

// ==========================================
// 9. LANZAMIENTO
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor ERP Boos Cloud corriendo en puerto ${PORT}`);
});
