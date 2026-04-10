
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

all_data = []

for f in files:
    try:
        df = pd.read_csv(f)
        if 'Fecha de pago' in df.columns and 'Vendedor/a' in df.columns:
            df['Fecha de pago'] = pd.to_datetime(df['Fecha de pago'], format='%d/%m/%Y', errors='coerce')
            # Filter for 2026 AND Vladimir Palma (Campanario)
            subset = df[(df['Fecha de pago'].dt.year == 2026) & (df['Vendedor/a'].str.contains("Vladimir", na=False))]
            if not subset.empty:
                subset['Monto_Num'] = subset['Monto'].apply(clean_amount)
                all_data.append(subset)
    except:
        continue

if not all_data:
    print("No se encontraron registros de Campanario (Vladimir) para 2026 en Downloads.")
else:
    full_df = pd.concat(all_data).drop_duplicates(subset=['N°', 'Cliente:', 'Fecha de pago', 'Plan']) # Avoid double counting overlapping files
    full_df['Mes'] = full_df['Fecha de pago'].dt.month
    
    # Monthly Summary
    print("--- RESUMEN MENSUAL CAMPANARIO 2026 ---")
    monthly = full_df.groupby('Mes').agg({'Monto_Num': 'sum', 'N°': 'count'}).rename(columns={'Monto_Num': 'Total', 'N°': 'Ventas'})
    print(monthly)
    
    print(f"\nTOTAL ACUMULADO 2026: ${full_df['Monto_Num'].sum():,}")
    
    # Top 6 Plans
    print("\n--- TOP 6 PLANES (MÁS ELEGIDOS POR ALUMNOS) ---")
    plan_counts = full_df[full_df['Plan'] != 'plan de prueba'].groupby('Plan').size().sort_values(ascending=False).head(6)
    
    top_6_names = plan_counts.index.tolist()
    top_6_total = full_df[full_df['Plan'].isin(top_6_names)]['Monto_Num'].sum()
    
    for p, c in plan_counts.items():
        p_total = full_df[full_df['Plan'] == p]['Monto_Num'].sum()
        print(f"  - {p}: {c} alumnos | Total Plan: ${p_total:,}")
    
    print(f"\nTOTAL ACUMULADO TOP 6 PLANES: ${top_6_total:,}")
