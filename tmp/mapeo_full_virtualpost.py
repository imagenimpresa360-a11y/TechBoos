import json, io, csv, os, time
import requests
import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv(r'c:\Users\DELL\Desktop\TECHEMPRESA\.env')

API_KEY    = os.getenv("VIRTUALPOS_API_KEY")
SECRET_KEY = os.getenv("VIRTUALPOS_SECRET_KEY")
BASE_URL   = os.getenv("VIRTUALPOS_BASE_URL", "https://api.virtualpos.cl/v3")

# ── Parser BoxMagic ──────────────────────────────────────
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
                        email = row[2].replace('\x00', '').strip().lower()
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
print(f"[OK] Emails Campanario cargados: {len(campanario_emails)}")

# ── Función para obtener token JWT ───────────────────────
def get_headers():
    payload = {"api_key": API_KEY, "exp": datetime.utcnow() + timedelta(minutes=10)}
    sig = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return {"accept": "application/json", "Authorization": API_KEY, "Signature": sig}

# ── Paginación completa ──────────────────────────────────
campanario_total, marina_total = 0, 0
campanario_count, marina_count = 0, 0
page = 1
total_pages = 1  # se actualiza en primera respuesta

print(f"[INICIO] Descargando todas las transacciones de VirtualPost...")
while page <= total_pages:
    try:
        r = requests.get(f"{BASE_URL}/payments?page={page}&limit=100", headers=get_headers(), timeout=15)
        if r.status_code != 200:
            print(f"  [ERROR] Página {page}: {r.status_code}")
            break
        data = r.json()
        if page == 1:
            total_pages = data['pagination']['pages']
            total_records = data['pagination']['total']
            print(f"[INFO] Total páginas: {total_pages} | Total transacciones: {total_records}")

        for p in data.get('payments', []):
            email = p['client'].get('email', '').strip().lower()
            monto = p['order'].get('amount', 0)
            if email in campanario_emails:
                campanario_count += 1
                campanario_total += monto
            else:
                marina_count += 1
                marina_total += monto

        if page % 10 == 0 or page == total_pages:
            print(f"  Página {page}/{total_pages} procesada... (Camp:{campanario_count} | Marina:{marina_count})")
        page += 1

    except Exception as e:
        print(f"  [ERROR] Página {page}: {e}")
        time.sleep(2)
        page += 1

# ── Resultado Final ──────────────────────────────────────
grand_total = campanario_total + marina_total
print("\n" + "="*58)
print("  MAPEO FULL VIRTUALPOST 2026 — RESULTADO DEFINITIVO")
print("="*58)
print(f"  Campanario : {campanario_count:>5} pagos  |  ${campanario_total:>14,.0f}")
print(f"  Marina     : {marina_count:>5} pagos  |  ${marina_total:>14,.0f}")
print(f"  TOTAL      : {campanario_count+marina_count:>5} pagos  |  ${grand_total:>14,.0f}")
if grand_total > 0:
    print(f"\n  % Campanario: {campanario_total/grand_total*100:.1f}%")
    print(f"  % Marina    : {marina_total/grand_total*100:.1f}%")
print("="*58)

# ── Guardar Resultado ────────────────────────────────────
out = {
    "metadata": {
        "fecha_mapeo": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "total_transacciones": campanario_count + marina_count,
        "emails_campanario_referencia": len(campanario_emails),
        "metodo": "join_email_boxmagic_campanario"
    },
    "campanario": {"count": campanario_count, "total_monto": campanario_total},
    "marina":     {"count": marina_count,     "total_monto": marina_total},
    "consolidado":{"total_monto": grand_total}
}
OUT = r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\mapeo_virtualpost_FULL.json'
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(out, f, indent=2, ensure_ascii=False)
print(f"\n[OK] Resultado completo guardado en: {OUT}")
