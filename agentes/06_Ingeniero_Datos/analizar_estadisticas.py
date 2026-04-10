
import pandas as pd
import glob
import os
import re

download_path = r'C:\Users\DELL\Downloads'
files = glob.glob(os.path.join(download_path, "BoxMagic*.csv"))

def clean_amount(val):
    if not isinstance(val, str): return 0
    # Remove $, spaces, and dots
    s = re.sub(r'[^\d]', '', val)
    return int(s) if s else 0

for f in files:
    try:
        df = pd.read_csv(f)
        if 'Fecha de pago' in df.columns:
            df['Fecha de pago'] = pd.to_datetime(df['Fecha de pago'], format='%d/%m/%Y', errors='coerce')
            march_data = df[df['Fecha de pago'].dt.month == 3]
            march_2026 = march_data[march_data['Fecha de pago'].dt.year == 2026]
            
            if not march_2026.empty:
                print(f"\n--- File: {os.path.basename(f)} (March 2026 data found) ---")
                
                # Plan Statistics
                plan_stats = march_2026.groupby('Plan').size().sort_values(ascending=False)
                print("\nPlanes vendidos en Marzo 2026:")
                print(plan_stats)
                
                # Payment method statistics
                # First clean amounts
                march_2026['Monto_Clean'] = march_2026['Monto'].apply(clean_amount)
                payment_stats = march_2026.groupby('Tipo')['Monto_Clean'].sum().sort_values(ascending=False)
                print("\nRecaudación por Medio de Pago (Marzo 2026):")
                print(payment_stats)
                
                # Total count by payment method
                payment_counts = march_2026['Tipo'].value_counts()
                print("\nCantidad de transacciones por Medio de Pago:")
                print(payment_counts)

    except Exception as e:
        print(f"Error processing {f}: {e}")
