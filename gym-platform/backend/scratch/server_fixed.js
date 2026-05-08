const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Resend } = require('resend');
const cron = require('node-cron');
const virtualPosService = require('./services/virtualposService');

// 1. INICIALIZACION CORE (DEBE IR PRIMERO)
const app = express();
const PORT = process.env.PORT || 3001;

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:Imagen30@localhost:5432/boos_erp_db",
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

const resend = new Resend(process.env.RESEND_API_KEY);
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// 2. DEFINICION DE FUNCIONES AUXILIARES
const sendEmail = async (to, subject, html) => {
  console.log(`[EMAIL] Intentando enviar correo a: ${to}...`);
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('[EMAIL] ❌ Variable RESEND_API_KEY no configurada');
      return false;
    }
    const { data, error } = await resend.emails.send({
      from: 'The Boos Box <contactoboosbox@gmail.com>',
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

// 3. TAREAS PROGRAMADAS (CRON)
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
                        <p>Te extrañamos en el Box. Regresa a entrenar con nosotros.</p>
                        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0; text-align: center;">
                            <h3 style="color: #f59e0b;">PACK RESCUE $27.000</h3>
                        </div>
                        <div style="text-align: center;">
                            <a href="${linkPago}" style="background: #000; color: #fff; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">RECLAMAR AHORA</a>
                        </div>
                    </div>
                </div>
            `;
            const enviado = await sendEmail(job.email, `🥊 ¡Te extrañamos, ${primerNombre}!`, html);
            if (enviado) {
                await pool.query("UPDATE cola_emails SET estado = 'Enviado', fecha_envio_programado = NOW() WHERE id = $1", [job.id]);
                await pool.query("INSERT INTO campanas_recuperacion (socio_id, tipo_contacto, estado_gestion, promo_ofrecida) VALUES ($1, 'Email Nocturno', 'Contactado', 'Pack Rescue $27k')", [job.socio_uuid]);
            }
        }
    } catch (err) { console.error('[CRON] Error:', err.message); }
}, { timezone: "America/Santiago" });

// 4. ENDPOINTS API
app.post('/api/campanas/encolar', async (req, res) => {
    const { socio_id } = req.body;
    try {
        await pool.query("INSERT INTO cola_emails (socio_id, estado) VALUES ($1, 'Pendiente')", [socio_id]);
        res.json({ success: true, mensaje: 'Añadido a la cola de despacho nocturno' });
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
            <div style="font-family: sans-serif; background: #000; color: #fff; padding: 40px; text-align: center; border-radius: 12px;">
                <h1 style="color: #f59e0b;">THE BOOS BOX</h1>
                <h2>¡Hola ${s.nombre.split(' ')[0]}!</h2>
                <p>Regresa al entrenamiento con nuestro Pack Rescue.</p>
                <a href="${linkPago}" style="background: #f59e0b; color: #000; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">RECLAMAR PROMO $27.000</a>
            </div>
        `;
        const enviado = await sendEmail(s.email, "🥊 ¡Regresa a The Boos Box!", html);
        if (enviado) {
            await pool.query("INSERT INTO campanas_recuperacion (socio_id, tipo_contacto, estado_gestion, promo_ofrecida) VALUES ($1, 'Email Auto', 'Contactado', 'Pack Rescue $27k')", [socio_id]);
            res.json({ success: true, mensaje: 'Email enviado correctamente' });
        } else {
            res.status(500).json({ error: 'Fallo al enviar el correo. Revisa la configuración de Resend.' });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// [AQUÍ IRÍAN EL RESTO DE TUS RUTAS EXISTENTES - LAS MANTENDRÉ EN EL SIGUIENTE PASO]
// ...
