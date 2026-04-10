"""
MAPEO TURBO FULL - AGRUPADO POR MES
Genera: { "enero": { "campanario": X, "marina": Y }, "febrero": {...}, ... }
"""
import json, io, csv, os, time
import requests, jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv(r'c:\Users\DELL\Desktop\TECHEMPRESA\.env')
API_KEY    = os.getenv("VIRTUALPOS_API_KEY")
SECRET_KEY = os.getenv("VIRTUALPOS_SECRET_KEY")
BASE_URL   = os.getenv("VIRTUALPOS_BASE_URL", "https://api.virtualpos.cl/v3")

MES_MAP = {'01':'enero','02':'febrero','03':'marzo','04':'abril',
           '05':'mayo','06':'junio','07':'julio','08':'agosto',
           '09':'septiembre','10':'octubre','11':'noviembre','12':'diciembre'}

def parse_boxmagic_emails(filepath):
    emails = set()
    with open(filepath, encoding='utf-8', errors='ignore') as f:
        for i, line in enumerate(f):
            if i == 0: continue
            inner = line.strip()
            if inner.startswith('"') and inner.endswith('"'):
                inner = inner[1:-1]
            inner = inner.replace('""', '\x00')
            try:
                for row in csv.reader(io.StringIO(inner)):
                    if len(row) >= 3:
                        email = row[2].replace('\x00','').strip().lower()
                        if '@' in email:
                            emails.add(email)
            except: pass
    return emails

CAMP_FILES = [
    r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\campanario\1.- enero BoxMagic (41).csv',
    r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\campanario\2.- Febrero BoxMagic .csv',
    r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\campanario\3.- marzo BoxMagic.csv',
    r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\campanario\4.- abril BoxMagic (corte).csv',
]
campanario_emails = set()
for f in CAMP_FILES:
    if os.path.exists(f):
        campanario_emails |= parse_boxmagic_emails(f)
print(f"[OK] Emails Campanario: {len(campanario_emails)}")

def get_headers():
    payload = {"api_key": API_KEY, "exp": datetime.utcnow() + timedelta(minutes=10)}
    sig = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return {"accept": "application/json", "Authorization": API_KEY, "Signature": sig}

# Estructura mensual de resultados
result = {}

page, total_pages = 1, 1
while page <= total_pages:
    try:
        r = requests.get(f"{BASE_URL}/payments?page={page}&limit=100", headers=get_headers(), timeout=15)
        if r.status_code != 200:
            print(f"  [ERROR] p{page}: {r.status_code}")
            break
        data = r.json()
        if page == 1:
            total_pages = data['pagination']['pages']
            print(f"[INFO] Páginas: {total_pages} | Total: {data['pagination']['total']}")

        for p in data.get('payments', []):
            created = p['order'].get('created_at', '')
            if len(created) < 7: continue
            mes_num = created[5:7]
            mes = MES_MAP.get(mes_num, 'otro')
            email = p['client'].get('email', '').strip().lower()
            monto = p['order'].get('amount', 0)

            if mes not in result:
                result[mes] = {'campanario': {'count':0,'monto':0}, 'marina': {'count':0,'monto':0}}

            if email in campanario_emails:
                result[mes]['campanario']['count'] += 1
                result[mes]['campanario']['monto']  += monto
            else:
                result[mes]['marina']['count'] += 1
                result[mes]['marina']['monto']  += monto

        if page % 10 == 0 or page == total_pages:
            print(f"  Pag {page}/{total_pages}...")
        page += 1
    except Exception as e:
        print(f"  [ERR] p{page}: {e}")
        time.sleep(2)
        page += 1

# Calcular consolidados por mes
for mes, data in result.items():
    data['consolidado'] = {
        'count': data['campanario']['count'] + data['marina']['count'],
        'monto': data['campanario']['monto']  + data['marina']['monto']
    }

print("\n=== RESULTADO MENSUAL ===")
for mes in ['enero','febrero','marzo','abril']:
    if mes in result:
        d = result[mes]
        print(f"{mes.upper():12} | Camp: ${d['campanario']['monto']:>12,.0f} ({d['campanario']['count']} pagos) "
              f"| Marina: ${d['marina']['monto']:>12,.0f} ({d['marina']['count']} pagos)")

OUT = r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\mapeo_virtualpost_MENSUAL.json'
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(result, f, indent=2, ensure_ascii=False)
print(f"\n[OK] Guardado: {OUT}")
