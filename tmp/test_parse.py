import io, csv, os

def parse_boxmagic(filepath):
    emails = set()
    with open(filepath, encoding='utf-8', errors='ignore') as f:
        for i, line in enumerate(f):
            if i == 0: continue
            inner = line.strip()
            if inner.startswith('"') and inner.endswith('"'):
                inner = inner[1:-1]
            inner = inner.replace('""', '\x00')
            try:
                reader = csv.reader(io.StringIO(inner))
                for row in reader:
                    if len(row) >= 3:
                        email = row[2].replace('\x00', '').strip().lower()
                        if '@' in email:
                            emails.add(email)
            except: pass
    return emails

filepath = r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\campanario\1.- enero BoxMagic (41).csv'
emails = parse_boxmagic(filepath)
print(f"Emails encontrados: {len(emails)}")
for e in sorted(list(emails))[:10]:
    print(f"  {e}")
