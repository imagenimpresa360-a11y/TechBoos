
import pandas as pd
import glob
import os
import re

download_path = r'C:\Users\DELL\Downloads'
files = glob.glob(os.path.join(download_path, "BoxMagic*.csv"))

def clean_amount(val):
    if not isinstance(val, str): return 0
    s = re.sub(r'[^\d]', '', val)
    return int(s) if s else 0

all_stats = []

for f in files:
    try:
        df = pd.read_csv(f)
        if 'Fecha de pago' in df.columns and 'Vendedor/a' in df.columns:
            df['Fecha de pago'] = pd.to_datetime(df['Fecha de pago'], format='%d/%m/%Y', errors='coerce')
            
            for m in [2, 3, 4]:
                subset = df[(df['Fecha de pago'].dt.month == m) & (df['Fecha de pago'].dt.year == 2026)]
                if not subset.empty:
                    seller = subset['Vendedor/a'].iloc[0]
                    monto = subset['Monto'].apply(clean_amount).sum()
                    count = len(subset)
                    
                    # Plan Stats
                    plans = subset['Plan'].value_counts().to_dict()
                    # Payment Method Stats
                    payments = subset['Tipo'].value_counts().to_dict()
                    
                    all_stats.append({
                        'File': os.path.basename(f),
                        'Month': m,
                        'Seller': seller,
                        'TotalMonto': monto,
                        'Count': count,
                        'Plans': plans,
                        'Payments': payments
                    })
    except:
        continue

# Pivot stats by Seller and Month
print("--- RESUMEN DE EXTRACCION POR SEDE (2026) ---")
for s in all_stats:
    sede = "Campanario (Vladimir)" if "Vladimir" in str(s['Seller']) else "Marina (Ruben)" if "Ruben" in str(s['Seller']) else f"Desconocida ({s['Seller']})"
    print(f"\nSede: {sede} | Mes: {s['Month']} | Registros: {s['Count']} | Ingreso: ${s['TotalMonto']:,}")
    print("--- Planes Top ---")
    sorted_plans = sorted(s['Plans'].items(), key=lambda x: x[1], reverse=True)[:5]
    for p, c in sorted_plans: print(f"  - {p}: {c}")
    print("--- Mix Pagos ---")
    for pm, c in s['Payments'].items(): print(f"  - {pm}: {c}")
