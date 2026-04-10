
import pandas as pd
import glob
import os
import re

download_path = r'C:\Users\DELL\Downloads'
files = glob.glob(os.path.join(download_path, "BoxMagic*.csv"))

results = []

for f in files:
    try:
        df = pd.read_csv(f)
        if 'Fecha de pago' in df.columns and 'Vendedor/a' in df.columns:
            df['Fecha de pago'] = pd.to_datetime(df['Fecha de pago'], format='%d/%m/%Y', errors='coerce')
            
            for m in [2, 3, 4]:
                subset = df[(df['Fecha de pago'].dt.month == m) & (df['Fecha de pago'].dt.year == 2026)]
                if not subset.empty:
                    seller = subset['Vendedor/a'].iloc[0]
                    results.append({
                        'file': os.path.basename(f),
                        'month': m,
                        'seller': seller,
                        'count': len(subset)
                    })
    except:
        continue

if results:
    print("--- ARCHIVOS DETECTADOS CON DATOS 2026 ---")
    for r in results:
        sede = "Campanario (Vladimir)" if "Vladimir" in str(r['seller']) else "Marina (Ruben)" if "Ruben" in str(r['seller']) else f"Desconocida ({r['seller']})"
        print(f"File: {r['file']} | Mes: {r['month']} | Sede: {sede} | Registros: {r['count']}")
else:
    print("No se encontraron registros de 2026 en ningun archivo.")
