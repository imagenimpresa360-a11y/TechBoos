
"""
MOTOR DE MAPEO v2.0 - FILTRADO POR INCLUSIÓN ESTRICTA
Solo mapea pagos que existen en BoxMagic (Campanario o Marina). 
El resto se ignora para no inflar los ingresos del Gimnasio.
"""
import json, io, csv, os, time, requests, jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv(r'c:\Users\DELL\Desktop\TECHEMPRESA\.env')
API_KEY    = os.getenv("VIRTUALPOS_API_KEY")
SECRET_KEY = os.getenv("VIRTUALPOS_SECRET_KEY")
BASE_URL   = os.getenv("VIRTUALPOS_BASE_URL", "https://api.virtualpos.cl/v3")

MES_MAP = {'01':'enero','02':'febrero','03':'marzo','04':'abril'}

def get_emails_from_folder(path):
    emails = set()
    if not os.path.exists(path): return emails
    for file in os.listdir(path):
        if file.endswith('.csv'):
            with open(os.path.join(path, file), encoding='utf-8', errors='ignore') as f:
                for i, line in enumerate(f):
                    if i == 0: continue
                    inner = line.strip()
                    if inner.startswith('"') and inner.endswith('"'): inner = inner[1:-1]
                    inner = inner.replace('""', '\x00')
                    try:
                        for row in csv.reader(io.StringIO(inner)):
                            if len(row) >= 3:
                                email = row[2].replace('\x00','').strip().lower()
                                if '@' in email: emails.add(email)
                    except: pass
    return emails

# 1. Cargar universos conocidos de emails
campanario_db = get_emails_from_folder(r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\campanario')
marina_db     = get_emails_from_folder(r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\marina')

print(f"Base de Datos: {len(campanario_db)} Campanario | {len(marina_db)} Marina")

def get_headers():
    payload = {"api_key": API_KEY, "exp": datetime.utcnow() + timedelta(minutes=10)}
    sig = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return {"accept": "application/json", "Authorization": API_KEY, "Signature": sig}

result = {}

page, total_pages = 1, 1
while page <= total_pages:
    try:
        r = requests.get(f"{BASE_URL}/payments?page={page}&limit=100", headers=get_headers(), timeout=15)
        if r.status_code != 200: break
        data = r.json()
        if page == 1: total_pages = data['pagination']['pages']

        for p in data.get('payments', []):
            created = p['order'].get('created_at', '')
            if len(created) < 7: continue
            mes_num = created[5:7]
            mes = MES_MAP.get(mes_num)
            if not mes: continue 

            email = p['client'].get('email', '').strip().lower()
            monto = p['order'].get('amount', 0)

            if mes not in result:
                result[mes] = {'campanario': {'count':0,'monto':0}, 'marina': {'count':0,'monto':0}, 'otros': {'count':0,'monto':0}}

            # LÓGICA DE INCLUSIÓN ESTRICTA
            if email in campanario_db:
                result[mes]['campanario']['count'] += 1
                result[mes]['campanario']['monto']  += monto
            elif email in marina_db:
                result[mes]['marina']['count'] += 1
                result[mes]['marina']['monto']  += monto
            else:
                # Este dinero entró pero NO es de alumnos del GYM
                result[mes]['otros']['count'] += 1
                result[mes]['otros']['monto']  += monto

        page += 1
    except: page += 1

# Consolidar solo GYM
for m in result:
    result[m]['consolidado_gym'] = {
        'monto': result[m]['campanario']['monto'] + result[m]['marina']['monto'],
        'count': result[m]['campanario']['count'] + result[m]['marina']['count']
    }

OUT = r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\mapeo_virtualpost_LIMPIO.json'
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(result, f, indent=2, ensure_ascii=False)

print("\n=== AUDITORÍA DE INGRESOS REALES ===")
for mes in result:
    d = result[mes]
    print(f"{mes.upper():10} | GYM: ${d['consolidado_gym']['monto']:>11,.0f} | EXCLUIDO (Otros): ${d['otros']['monto']:>11,.0f}")
