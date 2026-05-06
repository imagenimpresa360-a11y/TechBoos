import os
import smtplib
import sys
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from dotenv import load_dotenv

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

def enviar_test_marcela():
    sender = os.environ.get('SMTP_USER')
    password = os.environ.get('SMTP_PASS')
    recipient = "m.pazvaldes3@gmail.com"
    socio_nombre = "Marcela"
    
    # Intentar buscar a Marcela en la DB para un link real, o usar un fallback
    socio_id = "542e1e62-0ba0-42fe-8a02-4b264aaddba5" # Usamos el de Ruben por ahora para asegurar que carga algo
    
    # 2. Configurar Link de Pago
    base_url = "https://techboos-production-edd2.up.railway.app"
    pago_link = f"{base_url}/pago/{socio_id}"
    
    print(f"🚀 Enviando mail a Marcela ({recipient}) con link de pago: {pago_link}")
    
    # 3. Cargar plantilla
    with open('agentes/07_Agente_Publicidad/plantilla_mail_rescate.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 4. Reemplazar datos
    html = html.replace('[Nombre]', socio_nombre)
    html = html.replace('https://wa.me/569XXXXXXXX?text=Hola!%20Quiero%20mi%20pack%20de%20reactivacion%20CrossFit', pago_link)
    
    msg = MIMEMultipart()
    msg['From'] = f"The Boos Box <{sender}>"
    msg['To'] = recipient
    msg['Subject'] = "Tu desafío CrossFit te espera"
    
    msg.attach(MIMEText(html, 'html'))
    
    # 5. Adjuntar Logo
    logo_path = 'agentes/07_Agente_Publicidad/assets/logo_boos.png'
    if os.path.exists(logo_path):
        with open(logo_path, 'rb') as f:
            img = MIMEImage(f.read(), _subtype="png")
            img.add_header('Content-ID', '<logo_boos>')
            msg.attach(img)
    
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender, password)
        server.send_message(msg)
        server.quit()
        print(f"✅ ¡Correo para Marcela enviado exitosamente!")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    enviar_test_marcela()
