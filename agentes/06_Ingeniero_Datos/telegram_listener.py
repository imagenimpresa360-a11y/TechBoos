import os
import requests
import time
from datetime import datetime
from sqlalchemy import create_engine, text

# --- CONFIGURACION ---
TOKEN = "8769050073:AAHoT8N2DmqCPieIt5GmRXdtAE75uCQ4Y6U"
CHAT_ID_AUTORIZADO = "8674219703" # Ruben Rojas
DB_URL = "postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway"
engine = create_engine(DB_URL)

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] [TELEGRAM-LISTENER] {msg}")

def send_msg(text):
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    requests.post(url, json={"chat_id": CHAT_ID_AUTORIZADO, "text": text, "parse_mode": "Markdown"})

def obtener_resumen_ventas():
    hoy = datetime.now().strftime('%Y-%m-%d')
    mes_actual = datetime.now().strftime('%B').lower()
    
    try:
        with engine.connect() as conn:
            # Ventas de Hoy
            res_hoy = conn.execute(text("""
                SELECT COALESCE(SUM(monto), 0), COUNT(*) 
                FROM boxmagic_sales 
                WHERE fecha_pago LIKE :hoy
            """), {"hoy": f"%{hoy}%"}).fetchone()
            
            # Ventas del Mes
            res_mes = conn.execute(text("""
                SELECT COALESCE(SUM(monto), 0), sede, COUNT(*)
                FROM boxmagic_sales 
                WHERE mes = :mes
                GROUP BY sede
            """), {"mes": mes_actual}).fetchall()
            
            total_mes = sum(r[0] for r in res_mes)
            
            # Construir mensaje
            msg = f"📊 *RESUMEN DE VENTAS (BOXMAGIC)*\n"
            msg += f"📅 Fecha: {datetime.now().strftime('%d/%m/%Y')}\n\n"
            
            msg += f"💰 *Hoy:* ${res_hoy[0]:,.0f} ({res_hoy[1]} ventas)\n"
            msg += f"📅 *Total Mes:* ${total_mes:,.0f}\n\n"
            
            msg += "📍 *Desglose por Sede (Mes):*\n"
            for monto, sede, cant in res_mes:
                msg += f"• {sede}: ${monto:,.0f} ({cant} vtas)\n"
            
            return msg
    except Exception as e:
        return f"❌ Error al consultar la base de datos: {str(e)}"

def procesar_comando(comando):
    if comando == "/start":
        return "👋 Hola Ruben! Estoy listo. Usa /ventas para ver el resumen financiero."
    elif comando == "/ventas":
        return obtener_resumen_ventas()
    else:
        return "🤔 No entiendo ese comando aún. Intenta con /ventas"

def iniciar_escucha():
    log("Iniciando servicio de escucha de comandos...")
    last_update_id = 0
    
    while True:
        try:
            url = f"https://api.telegram.org/bot{TOKEN}/getUpdates?offset={last_update_id + 1}&timeout=30"
            response = requests.get(url).json()
            
            if "result" in response:
                for update in response["result"]:
                    last_update_id = update["update_id"]
                    
                    if "message" in update:
                        msg = update["message"]
                        user_id = str(msg["from"]["id"])
                        text_received = msg.get("text", "")
                        
                        if user_id == CHAT_ID_AUTORIZADO:
                            log(f"Comando recibido de Ruben: {text_received}")
                            respuesta = procesar_comando(text_received)
                            send_msg(respuesta)
                        else:
                            log(f"Intento de acceso no autorizado de ID: {user_id}")
            
        except Exception as e:
            log(f"Error en el bucle: {e}")
            time.sleep(5)

if __name__ == "__main__":
    iniciar_escucha()
