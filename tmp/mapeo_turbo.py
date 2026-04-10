import json, io, csv, os

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

print(f"Emails Campanario (todos los meses): {len(campanario_emails)}")

VP_FILE = r'c:\Users\DELL\Desktop\TECHEMPRESA\virtualpos_api_sample.json'
with open(VP_FILE, encoding='utf-8') as f:
    vp_data = json.load(f)

payments = vp_data.get('payments', [])
campanario_p, marina_p = [], []

for p in payments:
    email = p['client'].get('email', '').strip().lower()
    monto = p['order'].get('amount', 0)
    fecha = p['order'].get('created_at', '')[:10]
    status = p['order'].get('status', '')
    rec = {'email': email, 'monto': monto, 'fecha': fecha, 'status': status}
    if email in campanario_emails:
        campanario_p.append(rec)
    else:
        marina_p.append(rec)

total_c = sum(r['monto'] for r in campanario_p)
total_m = sum(r['monto'] for r in marina_p)

print("\n" + "="*55)
print("  MAPEO TURBO VIRTUALPOST — RESULTADO FINAL")
print("="*55)
print(f"  Campanario : {len(campanario_p):>4} pagos  |  ${total_c:>12,.0f}")
print(f"  Marina     : {len(marina_p):>4} pagos  |  ${total_m:>12,.0f}")
print(f"  TOTAL      : {len(payments):>4} pagos  |  ${total_c+total_m:>12,.0f}")
print("="*55)

out = {
    'metadata': {'fecha_mapeo': '2026-04-07', 'total_muestra': len(payments), 'emails_campanario': len(campanario_emails)},
    'campanario': {'count': len(campanario_p), 'total_monto': total_c},
    'marina': {'count': len(marina_p), 'total_monto': total_m}
}
OUT_FILE = r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\mapeo_virtualpost_resultado.json'
with open(OUT_FILE, 'w', encoding='utf-8') as f:
    json.dump(out, f, indent=2, ensure_ascii=False)
print(f"\nResultado guardado: {OUT_FILE}")
