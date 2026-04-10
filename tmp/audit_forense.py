
import json, io, csv, os, requests, jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv(r'c:\Users\DELL\Desktop\TECHEMPRESA\.env')
API_KEY = os.getenv('VIRTUALPOS_API_KEY')
SECRET_KEY = os.getenv('VIRTUALPOS_SECRET_KEY')
BASE_URL = os.getenv('VIRTUALPOS_BASE_URL', 'https://api.virtualpos.cl/v3')

def fmt(n): return f"${n:,.0f}"

def get_headers():
    payload = {'api_key': API_KEY, 'exp': datetime.utcnow() + timedelta(minutes=10)}
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    return {'accept': 'application/json', 'Authorization': API_KEY, 'Signature': token}

def sum_bm_detailed(path):
    total = 0
    if not os.path.exists(path): return 0
    with open(path, encoding='utf-8', errors='ignore') as f:
        for i, line in enumerate(f):
            if i == 0: continue
            inner = line.strip()
            if inner.startswith('"') and inner.endswith('"'): inner = inner[1:-1]
            inner = inner.replace('""', '\x00')
            try:
                for row in csv.reader(io.StringIO(inner)):
                    if len(row) >= 4:
                        monto_raw = row[3].replace('\x00','').replace('.','').replace('$','').strip()
                        if monto_raw.isdigit():
                            total += int(monto_raw)
            except: pass
    return total

# 1. Auditoría BoxMagic vs VirtualPost Q1 2026
audit = {
    '01': {'nome': 'ENERO',   'bm': 4187100, 'vp': 0}, # Marina Summary
    '02': {'nome': 'FEBRERO', 'bm': 4125000, 'vp': 0},
    '03': {'nome': 'MARZO',   'bm': 5520000, 'vp': 0}
}
# Add Campanario details
audit['01']['bm'] += sum_bm_detailed(r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\campanario\1.- enero BoxMagic (41).csv')
audit['02']['bm'] += sum_bm_detailed(r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\campanario\2.- Febrero BoxMagic .csv')
audit['03']['bm'] += sum_bm_detailed(r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\campanario\3.- marzo BoxMagic.csv')

# 2. Get VP Data
page, total_p = 1, 1
while page <= total_p:
    try:
        r = requests.get(f'{BASE_URL}/payments?page={page}&limit=100', headers=get_headers()).json()
        if page == 1: total_p = r['pagination']['pages']
        for p in r.get('payments', []):
            m = p['order'].get('created_at', '')[5:7]
            monto = p['order'].get('amount', 0)
            if m in audit: audit[m]['vp'] += monto
        page += 1
    except: page += 1

print("\n" + "="*80)
print(f"{'MES 2026':<12} | {'BOXMAGIC (VENTA GYM)':<20} | {'VIRTUALPOST (TOTAL CTA)':<20} | {'EXCEDENTE (OTRO)':<15}")
print("-"*80)
for k in sorted(audit.keys()):
    a = audit[k]
    gym = a['bm']
    vp_total = a['vp']
    excedente = vp_total - gym
    print(f"{a['nome']:<12} | {fmt(gym):>20} | {fmt(vp_total):>20} | {fmt(excedente):>15}")
print("="*80)
print("DIFERENCIA: El excedente representa dinero de otros negocios en la cuenta de VP.")
print(f"LIOREN (PAGO MENSUAL): $11,920")
