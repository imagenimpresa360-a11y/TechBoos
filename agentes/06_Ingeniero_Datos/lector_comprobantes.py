import imaplib
import email
import os
import psycopg2
import re
from dotenv import load_dotenv

load_dotenv()

# Configuración
EMAIL_USER = os.getenv('SMTP_USER')
EMAIL_PASS = os.getenv('SMTP_PASS')
DB_URL = os.getenv('DATABASE_URL')

def procesar_correos():
    print("🔍 Iniciando escaneo de comprobantes en contactoboosbox@gmail.com...")
    
    try:
        # Conexión IMAP
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(EMAIL_USER, EMAIL_PASS)
        mail.select("inbox")
        
        # Buscar correos no leídos con palabras clave
        # Nota: En producción usaríamos filtros más específicos
        status, messages = mail.search(None, '(UNSEEN OR SUBJECT "Comprobante" OR SUBJECT "Transferencia" OR SUBJECT "Webpay")')
        
        if status != 'OK' or not messages[0]:
            print("✅ No hay comprobantes nuevos por procesar.")
            return

        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()

        for num in messages[0].split():
            status, data = mail.fetch(num, "(RFC822)")
            msg = email.message_from_bytes(data[0][1])
            
            subject = msg["Subject"]
            body = ""
            
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        body = part.get_payload(decode=True).decode()
            else:
                body = msg.get_payload(decode=True).decode()

            print(f"📧 Procesando: {subject}")

            # Lógica de Extracción Simple (Mejorable con Agente 06)
            # Buscamos RUT o Montos
            monto_match = re.search(r'\$\s?([0-9\.]+)', body)
            rut_match = re.search(r'([0-9\.]{7,12}-[0-9kK])', body)
            
            monto = monto_match.group(1).replace('.', '') if monto_match else None
            rut = rut_match.group(1) if rut_match else None

            # Buscar socio por RUT o Email del remitente
            remitente = email.utils.parseaddr(msg["From"])[1]
            
            cur.execute("SELECT id, nombre FROM socios WHERE email = %s OR id::text LIKE %s LIMIT 1", (remitente, f"%{rut}%" if rut else "NO_RUT"))
            socio = cur.fetchone()

            if socio:
                print(f"✅ Socio identificado: {socio[1]}")
                # Registrar en campanas_recuperacion como "En Validación"
                cur.execute("""
                    INSERT INTO campanas_recuperacion (socio_id, tipo_contacto, estado_gestion, respuesta)
                    VALUES (%s, 'Email Automático', 'Interesado', %s)
                """, (socio[0], f"Comprobante detectado en mail. Asunto: {subject}"))
                conn.commit()
            else:
                print(f"⚠️ No se pudo identificar al socio para el correo: {subject}")

        conn.close()
        mail.close()
        mail.logout()
        
    except Exception as e:
        print(f"❌ Error en lector_comprobantes: {e}")

if __name__ == "__main__":
    procesar_correos()
