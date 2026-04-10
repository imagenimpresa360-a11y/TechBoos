import os
import pandas as pd
import glob

dir_bci = r"C:\Users\DELL\Desktop\TECHEMPRESA\agentes\02_CFO_Finanzas\BANCO BCI\CARTOLAS_MENSUALES"
cartolas = glob.glob(os.path.join(dir_bci, "*.xlsx"))

def clean_amount(val):
    clean_str = str(val).replace('$', '').replace('.', '').replace(' ', '').replace(',', '').strip()
    try:
        return int(float(clean_str))
    except:
        return 0

def deep_search_expanded():
    target_amt = 39900
    target_name = "moreno"
    
    print(f"=== BUSQUEDA EXPANDIDA (MONTO: {target_amt} / NOMBRE: {target_name.upper()}) ===")

    for cartola in cartolas:
        if "~$" in cartola: continue
        print(f"\nAnalizando: {os.path.basename(cartola)}")
        try:
            df = pd.read_excel(cartola)
            
            # Buscar en todo el dataframe
            for i, row in df.iterrows():
                row_list = row.values.tolist()
                row_str = " ".join([str(x).lower() for x in row_list])
                
                found_name = target_name in row_str
                found_amt = any(clean_amount(x) == target_amt for x in row_list)
                
                if found_name or found_amt:
                    print(f"[MATCH] Fila {i}: {row.to_dict()}")
        except Exception as e:
            print(f"Error procesando {cartola}: {e}")

deep_search_expanded()
