import os
import pandas as pd

dir_bci = r"C:\Users\DELL\Desktop\TECHEMPRESA\agentes\02_CFO_Finanzas\BANCO BCI\CARTOLAS_MENSUALES"
bci_file = os.path.join(dir_bci, "1. CARTOLA ENERO N1.xlsx")

def search_exact_payment():
    try:
        df = pd.read_excel(bci_file)
        # Buscar en todas las celdas el valor 39900
        matches = []
        for i, row in df.iterrows():
            row_vals = row.values.tolist()
            if 39900 in row_vals or '39900' in [str(x) for x in row_vals] or 39.900 in row_vals:
                matches.append(row.to_dict())
        
        if not matches:
            print("RESULTADO: No se encontro absolutamente ningun abono por $39.900 en la cartola de Enero.")
        else:
            print("RESULTADO: Se encontraron los siguientes movimientos de $39.900:")
            for m in matches:
                print(m)
                
    except Exception as e:
        print(f"Error: {e}")

search_exact_payment()
