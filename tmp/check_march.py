import pandas as pd
import warnings
warnings.filterwarnings("ignore")

file_path = r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\02_CFO_Finanzas\TRANSFERENCIAS\3.-Marzo TBB enviados cartola_06042026130619.xls'
df = pd.read_excel(file_path)
for i, row in df.iterrows():
    rs = str(row.values)
    if "76.134.902" in rs:
        print(" | ".join([str(x) for x in row.values]))
