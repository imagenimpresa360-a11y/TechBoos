import csv
import os
import xlrd

email_target = "pardonsierrap"

print("=== RASTREO COMPLETO DE FUENTES ===")

# Revisar CSV de Campanario
base = r"c:\PROYECTO DEV\AG TBB\agentes\06_Ingeniero_Datos\boxmagic"
for sede_folder in ["campanario", "marina"]:
    folder = os.path.join(base, sede_folder)
    for fname in sorted(os.listdir(folder)):
        fpath = os.path.join(folder, fname)
        try:
            with open(fpath, 'r', encoding='utf-8-sig', errors='replace') as f:
                reader = csv.reader(f)
                raw_rows = list(reader)
            for row in raw_rows:
                if email_target in str(row).lower():
                    print(f"\n[CSV {sede_folder}/{fname}]:")
                    print(f"  {row}")
        except Exception as e:
            print(f"  ERROR: {e}")

# Revisar Cartera Global
downloads = r"c:\PROYECTO DEV\AG TBB\agentes\06_Ingeniero_Datos\downloads_boxmagic"
fpath = os.path.join(downloads, "BoxMagic (1).csv")
with open(fpath, 'r', encoding='utf-8-sig', errors='replace') as f:
    reader = csv.reader(f)
    for row in reader:
        if email_target in str(row).lower():
            print(f"\n[Cartera Global BoxMagic (1).csv]:")
            print(f"  {row}")

# Revisar Alumnos Inactivos
fpath_xls = os.path.join(downloads, "Alumnos Inactivos.xls")
try:
    wb = xlrd.open_workbook(fpath_xls, encoding_override='utf-8', ignore_workbook_corruption=True)
    ws = wb.sheet_by_index(0)
    for row in range(ws.nrows):
        vals = [str(ws.cell_value(row, c)) for c in range(ws.ncols)]
        if email_target in " ".join(vals).lower():
            print(f"\n[Alumnos Inactivos.xls]:")
            print(f"  {vals}")
except Exception as e:
    print(f"Error XLS: {e}")

# Revisar Clientes.xls
fpath_clientes = os.path.join(downloads, "Clientes.xls")
try:
    wb = xlrd.open_workbook(fpath_clientes, encoding_override='utf-8', ignore_workbook_corruption=True)
    ws = wb.sheet_by_index(0)
    for row in range(ws.nrows):
        vals = [str(ws.cell_value(row, c)) for c in range(ws.ncols)]
        if email_target in " ".join(vals).lower():
            print(f"\n[Clientes.xls fila {row}]:")
            print(f"  {vals}")
except Exception as e:
    print(f"Error Clientes XLS: {e}")
