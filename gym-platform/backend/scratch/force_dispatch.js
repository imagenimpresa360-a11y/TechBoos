const { Pool } = require('pg');
const nodemailer = require('nodemailer');
require('dotenv').config();

const pool = new Pool({
  connectionString: "postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway",
  ssl: { rejectUnauthorized: false }
});

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function forceDispatch() {
  try {
    console.log("🔍 Buscando alumnos en cola...");
    const pendientes = await pool.query(`
        SELECT c.id as job_id, s.nombre, s.email, s.id as socio_uuid
        FROM cola_emails c
        JOIN socios s ON c.socio_id = s.id
        WHERE c.estado = 'Pendiente'
    `);

    if (pendientes.rows.length === 0) {
      console.log("ℹ️ No hay correos pendientes en la cola.");
      process.exit(0);
    }

    for (const job of pendientes.rows) {
      const primerNombre = job.nombre.split(' ')[0];
      console.log(`📧 Enviando a ${job.nombre} (${job.email})...`);

      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; background: #000;">
            <div style="padding: 40px; text-align: center;">
                <h1 style="color: #f59e0b; font-size: 28px; margin: 0; letter-spacing: 2px;">THE BOOS BOX</h1>
            </div>
            <div style="padding: 40px; background: #fff; color: #333;">
                <h2>¡Hola ${primerNombre}! 👋</h2>
                <p>Te extrañamos en el Box. Tenemos un Pack de Reingreso para ti:</p>
                <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0; text-align: center;">
                    <h3 style="color: #f59e0b;">PACK RESCUE $27.000</h3>
                    <p style="font-size: 14px; color: #64748b;">(4 Clases de Crossfit / Funcional)</p>
                </div>
                <div style="text-align: center;">
                    <a href="https://techboos-production-edd2.up.railway.app/pago/${job.socio_uuid}" style="background: #000; color: #fff; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">RECLAMAR AHORA</a>
                </div>
            </div>
        </div>
      `;

      await transporter.sendMail({
        from: '"The Boos Box" <contactoboosbox@gmail.com>',
        to: job.email,
        subject: `🥊 ¡Te extrañamos, ${primerNombre}! Regresa a The Boos Box`,
        html: html
      });

      // Actualizar estado en la BD
      await pool.query("UPDATE cola_emails SET estado = 'Enviado', fecha_envio_programado = NOW() WHERE id = $1", [job.job_id]);
      await pool.query("INSERT INTO campanas_recuperacion (socio_id, tipo_contacto, estado_gestion, promo_ofrecida) VALUES ($1, 'Email Test', 'Contactado', 'Pack Rescue $27k')", [job.socio_uuid]);
      
      console.log(`✅ ¡Correo enviado a ${job.nombre}!`);
    }

    console.log("\n🚀 Despacho forzado finalizado con éxito.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error en despacho:", err.message);
    process.exit(1);
  }
}

forceDispatch();
