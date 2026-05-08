import csv

FILE_PATH = r"C:\PROYECTO DEV\AG TBB\agentes\06_Ingeniero_Datos\boxmagic\campanario\2026\5.- Mayo boxmagic al 08052025.csv"

with open(FILE_PATH, mode='r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    print("Header Real:", header)
    first_row = next(reader)
    print("Primera Fila:", first_row)
