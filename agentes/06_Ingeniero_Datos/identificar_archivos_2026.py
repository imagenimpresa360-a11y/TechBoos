
import pandas as pd
import glob
import os

download_path = r'C:\Users\DELL\Downloads'
files = glob.glob(os.path.join(download_path, "BoxMagic*.csv"))

print(f"Buscando datos en {len(files)} archivos...")

results = []

for f in files:
    try:
        # Some files might have different headers or be active members reports
        df = pd.read_csv(f)
        if 'Fecha de pago' in df.columns:
            df['Fecha de pago'] = pd.to_datetime(df['Fecha de pago'], format='%d/%m/%Y', errors='coerce')
            
            # Count records for Feb, Mar, Apr 2026
            feb = len(df[(df['Fecha de pago'].dt.month == 2) & (df['Fecha de pago'].dt.year == 2026)])
            mar = len(df[(df['Fecha de pago'].dt.month == 3) & (df['Fecha de pago'].dt.year == 2026)])
            apr = len(df[(df['Fecha de pago'].dt.month == 4) & (df['Fecha de pago'].dt.year == 2026)])
            
            if feb > 0 or mar > 0 or apr > 0:
                results.append({
                    'file': os.path.basename(f),
                    'Feb26': feb,
                    'Mar26': mar,
                    'Apr26': apr
                })
    except:
        continue

if results:
    print("\nArchivos encontrados con datos de 2026:")
    for res in results:
        print(f"- {res['file']}: Feb={res['Feb26']}, Mar={res['Mar26']}, Apr={res['Apr26']}")
else:
    print("\nNo se encontraron registros de Feb, Mar o Abr 2026 en los CSVs de la carpeta Downloads.")
