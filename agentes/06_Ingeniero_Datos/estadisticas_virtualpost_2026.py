
import pandas as pd
import glob
import os

def analyze_virtualpost_trends():
    path = r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\VIRTUAL POST'
    files = glob.glob(os.path.join(path, "*.xlsx"))
    
    all_data = []
    for f in files:
        if "~$" in f: continue 
        try:
            df = pd.read_excel(f)
            month_label = os.path.basename(f).split(".")[0]
            df['Mes_Label'] = month_label
            all_data.append(df)
        except Exception as e:
            print(f"Error loading {f}: {e}")

    if not all_data:
        print("No data found.")
        return

    master_df = pd.concat(all_data, ignore_index=True)
    
    print("\n" + "="*60)
    print("ANÁLISIS ESTADÍSTICO DE VIRTUAL POST 2026")
    print("="*60)

    # 1. Medios de Pago
    print("\n--- DISTRIBUCIÓN POR MEDIO DE PAGO ---")
    method_dist = master_df.groupby('medio_de_pago').agg({'total': 'sum', 'id': 'count'}).rename(columns={'total': 'Monto', 'id': 'Transacciones'})
    print(method_dist)

    # 2. Análisis de Cuotas
    print("\n--- USO DE CUOTAS ---")
    col_cuotas = 'num_cuotas' if 'num_cuotas' in master_df.columns else 'numero_de_cuotas'
    if col_cuotas in master_df.columns:
        master_df['cuotas_clean'] = master_df[col_cuotas].fillna(1).astype(int)
        cuotas_dist = master_df[master_df['cuotas_clean'] > 1].groupby('cuotas_clean').size()
        print(f"Transacciones en cuotas: {len(master_df[master_df['cuotas_clean'] > 1])}")
        print(cuotas_dist)

    # 3. Planes/Productos
    print("\n--- TOP 10 PLANES (VIRTUAL POST DESCRIPTION) ---")
    if 'producto' in master_df.columns:
        print(master_df['producto'].value_counts().head(10))

    # 4. Financiero
    print("\n--- RENDIMIENTO MENSUAL ---")
    monthly = master_df.groupby('Mes_Label').agg({'total': 'sum', 'total_abono': 'sum'})
    monthly['Comision'] = monthly['total'] - monthly['total_abono']
    print(monthly)

    print("\n" + "="*60)

if __name__ == "__main__":
    analyze_virtualpost_trends()
