import pandas as pd
import glob
import warnings
warnings.filterwarnings("ignore")

def check_all():
    target_rut = "76.134.902"
    files = glob.glob(r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\02_CFO_Finanzas\**\*.xls*', recursive=True)
    
    for file in files:
        if "node_modules" in file: continue
        fn = file.split("\\")[-1]
        try:
            df = pd.read_excel(file)
            for _, row in df.iterrows():
                row_str = " ".join([str(x) for x in row.values])
                if target_rut in row_str:
                    print("FILE:", fn, "| ROW:", row_str)
        except: pass

if __name__ == "__main__":
    check_all()
