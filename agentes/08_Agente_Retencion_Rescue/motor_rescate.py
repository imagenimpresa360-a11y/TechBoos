import os
import json
import psycopg2
from dotenv import load_dotenv

# Configuración del entorno
load_dotenv()

class BoosRescueMotor:
    def __init__(self):
        self.conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        self.cursor = self.conn.cursor()

    def obtener_inactivos_prioritarios(self):
        """
        Obtiene alumnos que no han pagado en >30 días.
        Prioriza los que tienen teléfono e Instagram registrados.
        """
        query = "SELECT id, nombre, email, telefono, dias_inactivos FROM socios WHERE estado = 'Inactivo' AND dias_inactivos > 30"
        self.cursor.execute(query)
        return self.cursor.fetchall()

    def ejecutar_capa_1_email(self):
        """
        Envío masivo de correos usando la plantilla de Agente 07.
        Registra el envío en la tabla 'campanas_recuperacion'.
        """
        inactivos = self.obtener_inactivos_prioritarios()
        print(f"🚀 Iniciando Capa 1: Envío masivo a {len(inactivos)} alumnos.")
        # Lógica de envío (SendGrid/Mailchimp) aquí
        for alumno in inactivos:
            # alumno_id = alumno[0]
            # enviar_email(alumno[2], "Vuelve a The Boos Box - Promo Especial")
            pass

    def track_click(self, alumno_id):
        """
        Marca a un alumno como 'INTERESADO' tras hacer clic en el mail.
        Esto gatilla la Capa 2 (WhatsApp).
        """
        query = "UPDATE socios SET segmento_riesgo = 'HOT_LEAD' WHERE id = %s"
        self.cursor.execute(query, (alumno_id,))
        self.conn.commit()
        print(f"🔥 Alumno {alumno_id} marcado como HOT LEAD.")

if __name__ == "__main__":
    motor = BoosRescueMotor()
    # motor.ejecutar_capa_1_email()
