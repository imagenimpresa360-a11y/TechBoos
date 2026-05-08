import io
import csv

FILE_PATH = r"C:\PROYECTO DEV\AG TBB\agentes\06_Ingeniero_Datos\boxmagic\campanario\2026\5.- Mayo boxmagic al 08052025.csv"

with open(FILE_PATH, mode='r', encoding='utf-8') as f:
    lines = f.readlines()
    line = lines[0].strip().strip('"').replace('""', '"')
    print(f"Línea limpia: [{line}]")
    
    f_in = io.StringIO(line)
    reader = csv.reader(f_in)
    header = next(reader)
    print("Columnas detectadas:", header)
