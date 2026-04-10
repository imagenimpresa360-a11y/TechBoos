
import pandas as pd
import glob
import os

list_res = []
path = r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\02_CFO_Finanzas\TRANSFERENCIAS\*.xls'
for f in glob.glob(path):
    try:
        df = pd.read_excel(f, skiprows=10)
        # Search in all columns
        mask = df.stack().str.contains('arriendo|canon', case=False, na=False).unstack().any(axis=1)
        matches = df[mask]
        if not matches.empty:
            matches['file'] = os.path.basename(f)
            list_res.append(matches)
    except Exception as e:
        print(f"Error reading {f}: {e}")

if list_res:
    res = pd.concat(list_res)
    # Get Date (0), Amount (3), Beneficiary (6), Concept (8)
    print(res.iloc[:, [0,3,6,8]])
else:
    print("No se encontraron registros de ARRIENDO en las transferencias.")
