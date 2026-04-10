import os
import glob
import pandas as pd

# Directorios
dir_boxmagic = r"c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\campanario"
dir_bci = r"C:\Users\DELL\Desktop\TECHEMPRESA\agentes\02_CFO_Finanzas\BANCO BCI\CARTOLAS_MENSUALES"

def clean_amount(val):
    clean_str = str(val).replace('$', '').replace('.', '').replace('""', '').replace('"', '').replace(' ', '').strip()
    try:
        if not clean_str: return 0
        return int(clean_str)
    except:
        return 0

def normalize_name(name):
    return " ".join(str(name).lower().strip().split())

def deep_audit_january():
    # 1. Cargar BCI
    bci_file = os.path.join(dir_bci, "1. CARTOLA ENERO N1.xlsx")
    df_bci = pd.read_excel(bci_file)
    col_abono = None
    for i in range(15):
        row = df_bci.iloc[i]
        if any('abono' in str(v).lower() for v in row):
            df_bci.columns = df_bci.iloc[i]
            df_bci = df_bci[i+1:].reset_index(drop=True)
            col_abono = [c for c in df_bci.columns if 'abono' in str(c).lower()][0]
            break
    
    bci_abonos = df_bci[col_abono].apply(clean_amount).tolist()

    # 2. Cargar BoxMagic
    archivo_bm = glob.glob(os.path.join(dir_boxmagic, "1.- enero*.csv"))[0]
    with open(archivo_bm, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    header = lines[0].strip().strip('"').split(',')
    headers = [h.replace('""', '').replace('"', '').replace(':', '').strip() for h in header]
    
    idx_tipo = headers.index('Tipo')
    idx_monto = headers.index('Monto')
    idx_cli = headers.index('Cliente') if 'Cliente' in headers else headers.index('Cliente:') if 'Cliente:' in headers else -1
    idx_fecha = headers.index('Fecha de pago')

    all_records = []
    for line in lines[1:]:
        cols = [c.replace('""', '').replace('"', '').strip() for c in line.strip().strip('"').split(',')]
        if len(cols) <= max(idx_tipo, idx_monto): continue
        monto = clean_amount(cols[idx_monto])
        if monto <= 0: continue
        all_records.append({
            'Cliente_Original': cols[idx_cli] if idx_cli != -1 else 'S/N',
            'Cliente_Norm': normalize_name(cols[idx_cli]) if idx_cli != -1 else 's/n',
            'Fecha': cols[idx_fecha],
            'Monto': monto,
            'Tipo': cols[idx_tipo].lower().strip()
        })

    df_bm = pd.DataFrame(all_records)

    # --- TAREA 1: DETECTAR DUPLICADOS (INTELIGENTE) ---
    duplicates = df_bm[df_bm.duplicated(subset=['Cliente_Norm', 'Fecha', 'Monto'], keep=False)]
    
    # --- TAREA 2: DETECTAR EFECTIVOS EN BANCO ---
    mislabeled = []
    efectivos = df_bm[df_bm['Tipo'].str.contains('efectivo')]
    for idx, row in efectivos.iterrows():
        if row['Monto'] in bci_abonos:
            mislabeled.append(row)

    print("\n=== REPORTE DE DUPLICADOS (MISMO CLIENTE, FECHA Y MONTO) ===")
    if duplicates.empty:
        print("No se encontraron duplicados.")
    else:
        print(duplicates[['Fecha', 'Cliente_Original', 'Monto', 'Tipo']].to_string(index=False))

    print("\n=== REPORTE DE EFECTIVOS QUE APARECEN EN EL BANCO (DIFERENCIA TIPO) ===")
    if not mislabeled:
        print("Ningún pago marcado como Efectivo coincide con abonos en el BCI.")
    else:
        df_mis = pd.DataFrame(mislabeled)
        print(df_mis[['Fecha', 'Cliente_Original', 'Monto', 'Tipo']].to_string(index=False))

deep_audit_january()
