import os
import smtplib
import sys
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

def enviar_test_real():
    sender = os.environ.get('SMTP_USER')
    password = os.environ.get('SMTP_PASS')
    recipient = "rubenrojasb@gmail.com"
    
    # 1. Obtener un ID real de un alumno critico para el link
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute("SELECT id, nombre FROM socios WHERE segmento_riesgo='Critico' LIMIT 1")
        res = cur.fetchone()
        conn.close()
        socio_id = res[0] if res else 1
    except:
        socio_id = 1

    # 2. Configurar Link de Pago (Simulado en Railway)
    base_url = "https://techboos-erp.railway.app" # URL de producción estimada
    pago_link = f"{base_url}/pago/{socio_id}"
    
    print(f"🚀 Enviando mail final a {recipient} con link de pago: {pago_link}")
    
    # 3. Cargar plantilla
    with open('agentes/07_Agente_Publicidad/plantilla_mail_rescate.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 4. Reemplazar datos
    html = html.replace('[Nombre]', 'Rubén')
    # Actualizar el link del botón en la plantilla
    html = html.replace('https://wa.me/569XXXXXXXX?text=Hola!%20Quiero%20mi%20pack%20de%20reactivacion%20CrossFit', pago_link)
    
    msg = MIMEMultipart()
    msg['From'] = f"The Boos Box <{sender}>"
    msg['To'] = recipient
    msg['Subject'] = "🏋️‍♂️ ¿Listo para tu próximo WOD? (The Boos Box)"
    
    msg.attach(MIMEText(html, 'html'))
    
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender, password)
        server.send_message(msg)
        server.quit()
        print(f"✅ ¡Correo final enviado exitosamente!")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    enviar_test_real()
