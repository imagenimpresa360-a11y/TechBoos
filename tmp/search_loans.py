import pandas as pd
import glob
import warnings
warnings.filterwarnings("ignore")

def final_search():
    search_path = r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\02_CFO_Finanzas\**\*.xls*'
    target_rut = "76.134.902"
    files = glob.glob(search_path, recursive=True)
    
    print("--- REPORTE DE PRÉSTAMOS A IMAGEN IMPRESA (2026) ---")
    total_loans = 0

    for file in files:
        if "node_modules" in file: continue
        filename = file.split("\\")[-1]
        try:
            df = pd.read_excel(file)
            for _, row in df.iterrows():
                row_list = [str(x) for x in row.values]
                row_str = " ".join(row_list)
                
                if target_rut in row_str or "IMAGEN IMPRESA" in row_str.upper():
                    monto = 0
                    for val in row_list:
                        if val == 'nan': continue
                        clean = val.replace(".", "").replace(",", "").split(".")[0]
                        if clean.isdigit():
                            val_int = int(clean)
                            if 10000 < val_int < 10000000 and val_int != 76134902 and val_int != 986860305:
                                monto = val_int
                    
                    if monto > 0:
                        print(f"Fecha: {row_list[0]} | Monto: ${monto:,.0f} | Archivo: {filename}")
                        total_loans += monto
        except: pass

    print(f"\nTOTAL ACUMULADO PRESTADO: ${total_loans:,.0f}")

if __name__ == "__main__":
    final_search()
