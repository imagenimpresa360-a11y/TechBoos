
import pandas as pd
import glob
import os

keywords = ['ENEL', 'SMAPA', 'ENTEL', 'SAESA', 'CGE']
path = r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\02_CFO_Finanzas\BANCO BCI\CARTOLAS_MENSUALES\*.xlsx'

print("INICIANDO AUDITORÍA DE SERVICIOS BÁSICOS (Q1)")
print("-" * 50)

for f in glob.glob(path):
    print(f"\nAnalizando: {os.path.basename(f)}")
    try:
        df = pd.read_excel(f, skiprows=14)
        # Search for any keyword in all columns
        mask = df.astype(str).apply(lambda x: x.str.contains('|'.join(keywords), case=False, na=False)).any(axis=1)
        matches = df[mask]
        if not matches.empty:
            # Columns: 0 (Date), 3 (Amount?), 6 (Name?), 8 (Label), 9 (Amount)
            # Re-adjust column indices based on previous success
            print(matches.iloc[:, [0, 8, 9]])
        else:
            print("No se detectaron pagos de servicios en este mes.")
    except Exception as e:
        print(f"Error: {e}")
