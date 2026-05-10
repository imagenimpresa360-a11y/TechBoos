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

async function runTest() {
  const emails = ['rubenrojasb@gmail.com', 'm.pazvaldes3@gmail.com'];
  
  for (const email of emails) {
    try {
      const res = await pool.query("SELECT id, nombre, email FROM socios WHERE email = $1 LIMIT 1", [email]);
      if (res.rows.length === 0) continue;
      
      const s = res.rows[0];
      const primerNombre = s.nombre.split(' ')[0];
      const linkPago = `https://techboos-production-edd2.up.railway.app/pago/${s.id}`;
      
      console.log(`📧 Enviando a ${s.nombre}...`);

      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; background: #000;">
            <div style="padding: 40px; text-align: center;">
                <h1 style="color: #f59e0b; font-size: 28px; margin: 0; letter-spacing: 2px;">THE BOOS BOX</h1>
            </div>
            <div style="padding: 40px; background: #fff; color: #333;">
                <h2>¡Hola ${primerNombre}! 👋</h2>
                <p>Hace tiempo que no te vemos en el Box y la comunidad extraña tu energía. Sabemos que quieres retomar tus entrenamientos y que solo estás esperando el momento ideal para hacerlo. ¡Ese momento es ahora!</p>
                <p>Vuelve con nuestra promoción exclusiva y reincorpórate con todo a <strong>The Boos Box</strong>:</p>
                
                <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0; text-align: center;">
                    <h3 style="color: #f59e0b; text-transform: uppercase; letter-spacing: 1px; margin-top: 0;">PACK REINCORPORACIÓN</h3>
                    <p style="font-size: 42px; font-weight: 900; margin: 10px 0;">$19.900</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${linkPago}" style="background: #000; color: #fff; padding: 18px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">RECLAMAR MI LUGAR AHORA</a>
                </div>
            </div>
        </div>
      `;

      await transporter.sendMail({
        from: '"The Boos Box" <contactoboosbox@gmail.com>',
        to: s.email,
        subject: `🥊 ¡Te extrañamos, ${primerNombre}!`,
        html: html
      });
      
      // Registrar en historial para que el usuario lo vea en el ERP
      await pool.query("INSERT INTO campanas_recuperacion (socio_id, tipo_contacto, estado_gestion, promo_ofrecida) VALUES ($1, 'Email Test 2', 'Contactado', 'Pack Reinc. $19.9k')", [s.id]);

      console.log(`✅ Enviado a ${s.nombre}`);
    } catch (e) {
      console.error(`❌ Error con ${email}:`, e.message);
    }
  }
  process.exit(0);
}

runTest();
