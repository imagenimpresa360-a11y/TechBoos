
import pandas as pd
import glob
import os

keywords = ['18.990', '112.886', '22.550', '28.949', '14.435']
path = r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\02_CFO_Finanzas\BANCO BCI\CARTOLAS_MENSUALES\*.xlsx'

print("BUSCANDO MONTOS ESPECÍFICOS DE BOLETAS EN CARTOLAS")
print("-" * 50)

for f in glob.glob(path):
    print(f"\nArchivo: {os.path.basename(f)}")
    try:
        df = pd.read_excel(f, skiprows=5)
        # Search for any of the values as strings
        mask = df.astype(str).apply(lambda x: x.str.contains('|'.join(keywords), na=False)).any(axis=1)
        match = df[mask]
        if not match.empty:
            print(match.iloc[:, [0,3,6,7,8,9]])
        else:
            print("No se encontraron esos montos en este archivo.")
    except Exception as e:
        print(f"Error: {e}")
