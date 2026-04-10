import pandas as pd
import os
import glob
import warnings
warnings.filterwarnings("ignore")

def final_report():
    search_path = r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\02_CFO_Finanzas\**\*.xls*'
    target_rut = "76.134.902"
    files = glob.glob(search_path, recursive=True)
    
    for file in files:
        if "node_modules" in file: continue
        fn = os.path.basename(file)
        try:
            df = pd.read_excel(file)
            for _, row in df.iterrows():
                rl = [str(x) for x in row.values]
                row_str = " ".join(rl)
                if target_rut in row_str or "IMAGEN IMPRESA" in row_str.upper():
                    print("FILE:", fn)
                    print("RAW:", rl)
                    print("-" * 50)
        except: pass

if __name__ == "__main__":
    final_report()
