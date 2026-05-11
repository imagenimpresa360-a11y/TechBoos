const { Resend } = require('resend');
const resend = new Resend('re_3vqgZdWo_K8ZcTvyKqLdejdYiV8mkEtgk');

async function testResend() {
    console.log("🧪 Iniciando test de Resend...");
    try {
        const { data, error } = await resend.emails.send({
            from: 'The Boos Box Test <onboarding@resend.dev>',
            to: 'contactoboosbox@gmail.com',
            subject: '🧪 TEST DE CONEXIÓN RESEND',
            html: '<h1>¡Funciona!</h1><p>Si lees esto, la API Key de Resend está activa y el sistema puede enviar correos.</p>'
        });

        if (error) {
            console.error("❌ Error de Resend:", error);
        } else {
            console.log("✅ Email enviado exitosamente!", data);
        }
    } catch (e) {
        console.error("❌ Error crítico:", e.message);
    }
    process.exit(0);
}

testResend();
