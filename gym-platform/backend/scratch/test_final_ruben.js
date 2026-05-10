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

async function testSingle() {
  const email = 'rubenrojasb@gmail.com';
  try {
    const res = await pool.query("SELECT id, nombre FROM socios WHERE email = $1 LIMIT 1", [email]);
    if (res.rows.length === 0) return console.log("No encontré a Ruben.");
    
    const s = res.rows[0];
    const primerNombre = s.nombre.split(' ')[0];
    const linkPago = `https://techboos-production-edd2.up.railway.app/pago/${s.id}`;
    
    console.log(`📧 Despachando prueba a ${s.nombre}...`);

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; background: #000;">
          <div style="padding: 40px; text-align: center;">
              <h1 style="color: #f59e0b; font-size: 28px; margin: 0; letter-spacing: 2px;">THE BOOS BOX</h1>
          </div>
          <div style="padding: 40px; background: #fff; color: #333;">
              <h2 style="margin-top: 0;">¡Hola ${primerNombre}! 👋</h2>
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

    await transporter.sendMail({
      from: '"The Boos Box" <contactoboosbox@gmail.com>',
      to: email,
      subject: `🥊 ¡Te extrañamos, ${primerNombre}! Regresa a The Boos Box`,
      html: html
    });

    console.log("✅ Prueba enviada exitosamente.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

testSingle();
