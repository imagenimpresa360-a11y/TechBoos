import csv

total = 0
count = 0
file_path = r'C:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\1.- enero BoxMagic (41).csv'

with open(file_path, mode='r', encoding='utf-8') as f:
    lines = f.readlines()
    for line in lines[1:]: # Skip header
        # Cleanup line: "14793,""Valeska Darian"",""...""$ 37900"",""..."
        parts = line.split(',')
        if len(parts) >= 9:
            # The amount is usually in the 9th position (index 8)
            # Example: ...,""$ 37900""
            monto_raw = parts[8].replace('"', '').replace('$', '').replace('.', '').replace(' ', '').strip()
            if monto_raw.isdigit():
                total += int(monto_raw)
                count += 1

print(f"RESULTADO: Total Ingresos Enero 2026: ${total:,}")
print(f"RESULTADO: Cantidad de Pagos: {count}")
