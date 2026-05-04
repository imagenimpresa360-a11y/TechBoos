import os
import smtplib
import sys
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Forzar UTF-8
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

def enviar_test():
    sender = os.environ.get('SMTP_USER')
    password = os.environ.get('SMTP_PASS')
    recipient = "rubenrojasb@gmail.com"
    
    print(f"🚀 Iniciando envío de prueba desde {sender}...")
    
    # Cargar plantilla
    try:
        with open('agentes/07_Agente_Publicidad/plantilla_mail_rescate.html', 'r', encoding='utf-8') as f:
            html = f.read()
    except Exception as e:
        print(f"❌ Error leyendo plantilla: {e}")
        return

    # Personalizar
    html = html.replace('[Nombre]', 'Rubén')
    
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
        print(f"✅ ¡Correo enviado exitosamente a {recipient}!")
    except Exception as e:
        print(f"❌ Error enviando correo: {e}")

if __name__ == "__main__":
    enviar_test()
