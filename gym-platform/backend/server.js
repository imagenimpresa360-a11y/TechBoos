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

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"The Boos Box" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });
    console.log(`Email enviado a: ${to}`);
  } catch (error) {
    console.error(`Error enviando email a ${to}:`, error);
  }
};

const upload = multer({ dest: 'uploads/' });
const app = express();
const PORT = process.env.PORT || 3001;
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

app.use(cors());
app.use(express.json());

// DETECCION DE PATHS PARA RAILWAY
let distPath = path.resolve(__dirname, '..', '..', 'dist');
if (!fs.existsSync(path.join(distPath, 'index.html'))) {
    distPath = path.resolve(__dirname, '..', 'dist');
}
const indexPath = path.join(distPath, 'index.html');

app.use(express.static(distPath));

// API ROUTES
app.get('/api/cuentas', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM "CuentaContable" ORDER BY CASE tipo WHEN 'Ingreso' THEN 1 WHEN 'Egreso' THEN 2 WHEN 'Pasivo' THEN 3 ELSE 4 END, nombre ASC`);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/pago/:id', async (req, res) => {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) return res.status(404).json({ error: 'ID Inválido' });
    try {
        const result = await pool.query('SELECT id, nombre, email, sede_habitual FROM socios WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Socio no encontrado' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/payments/create-link', async (req, res) => {
  const { socioId, amount, description } = req.body;
  try {
    const socioRes = await pool.query('SELECT * FROM socios WHERE id = $1', [socioId]);
    if (socioRes.rows.length === 0) return res.status(404).json({ error: 'Socio no encontrado' });
    const socio = socioRes.rows[0];
    const payment = await virtualPosService.createPayment(amount, description, socio.email, socio.nombre);
    await pool.query('UPDATE socios SET vpos_uuid = $1 WHERE id = $2', [payment.uuid, socioId]);
    res.json({ url: payment.web_checkout_url, uuid: payment.uuid });
  } catch (error) {
    res.status(500).json({ error: 'Error al generar link de pago' });
  }
});

app.post('/api/payments/webhook', async (req, res) => {
  const { uuid } = req.body;
  try {
    const paymentDetail = await virtualPosService.getPaymentStatus(uuid);
    if (paymentDetail.status === 'paid' || paymentDetail.status === 'approved') {
        await pool.query("UPDATE socios SET estado = 'Recuperado' WHERE vpos_uuid = $1", [uuid]);
    }
    res.sendStatus(200);
  } catch (error) { res.sendStatus(500); }
});

// SPA FALLBACK
app.get('*', (req, res) => {
    if (req.url.startsWith('/api')) return res.status(404).send('API not found');
    res.sendFile(indexPath);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
