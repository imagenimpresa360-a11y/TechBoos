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

def audit_all_months():
    meses_map = {
        'enero': '1. CARTOLA ENERO N1.xlsx',
        'febrero': '2. CARTOLA FEBRERO N2.xlsx',
        'marzo': '3. CARTOLA MARZO N3.xlsx'
    }

    all_duplicates = []
    all_mislabeled = []

    for mes_nombre, cartola_name in meses_map.items():
        # 1. Cargar BCI del mes
        bci_path = os.path.join(dir_bci, cartola_name)
        if not os.path.exists(bci_path):
            #print(f"Saltando {mes_nombre}: No hay cartola.")
            continue
            
        try:
            df_bci = pd.read_excel(bci_path)
            col_abono = None
            for i in range(15):
                if i >= len(df_bci): break
                row = df_bci.iloc[i]
                if any('abono' in str(v).lower() or 'credito' in str(v).lower() for v in row):
                    df_bci.columns = df_bci.iloc[i]
                    df_bci = df_bci[i+1:].reset_index(drop=True)
                    # Buscar columna abono
                    cols = [c for c in df_bci.columns if 'abono' in str(c).lower() or 'credito' in str(c).lower()]
                    if cols: col_abono = cols[0]
                    break
            
            bci_abonos = []
            if col_abono:
                bci_abonos = df_bci[col_abono].apply(clean_amount).tolist()
        except:
            bci_abonos = []

        # 2. Cargar BoxMagic del mes
        archivos_bm = glob.glob(os.path.join(dir_boxmagic, f"*{mes_nombre}*.csv"))
        if not archivos_bm: continue
        archivo_bm = archivos_bm[0]
        
        with open(archivo_bm, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        if len(lines) < 2: continue
        header = lines[0].strip().strip('"').split(',')
        headers = [h.replace('""', '').replace('"', '').replace(':', '').strip() for h in header]
        
        idx_tipo = headers.index('Tipo') if 'Tipo' in headers else -1
        idx_monto = headers.index('Monto') if 'Monto' in headers else -1
        idx_cli = headers.index('Cliente') if 'Cliente' in headers else headers.index('Cliente:') if 'Cliente:' in headers else -1
        idx_fecha = headers.index('Fecha de pago') if 'Fecha de pago' in headers else -1

        if -1 in [idx_tipo, idx_monto, idx_cli, idx_fecha]: continue

        current_bm_records = []
        for line in lines[1:]:
            cols = [c.replace('""', '').replace('"', '').strip() for c in line.strip().strip('"').split(',')]
            if len(cols) <= max(idx_tipo, idx_monto, idx_cli, idx_fecha): continue
            
            monto = clean_amount(cols[idx_monto])
            if monto <= 0: continue
            
            rec = {
                'Mes': mes_nombre.capitalize(),
                'Cliente_Original': cols[idx_cli],
                'Cliente_Norm': normalize_name(cols[idx_cli]),
                'Fecha': cols[idx_fecha],
                'Monto': monto,
                'Tipo': cols[idx_tipo].lower().strip()
            }
            current_bm_records.append(rec)

        df_bm = pd.DataFrame(current_bm_records)

        # Duplicados
        dups = df_bm[df_bm.duplicated(subset=['Cliente_Norm', 'Fecha', 'Monto'], keep=False)]
        if not dups.empty:
            all_duplicates.append(dups)

        # Mislabeled
        for idx, row in df_bm.iterrows():
            if 'efectivo' in row['Tipo'] and row['Monto'] in bci_abonos:
                all_mislabeled.append(row)

    print("\n=== REPORTE GLOBAL DE DUPLICADOS (TODOS LOS MESES) ===")
    if not all_duplicates:
        print("No se encontraron duplicados en otros meses.")
    else:
        df_all_dups = pd.concat(all_duplicates)
        print(df_all_dups[['Mes', 'Fecha', 'Cliente_Original', 'Monto', 'Tipo']].to_string(index=False))

    print("\n=== REPORTE GLOBAL DE EFECTIVOS DETECTADOS EN BANCO (DIFERENCIAS) ===")
    if not all_mislabeled:
        print("No se encontraron pagos en efectivo que coincidan con el banco.")
    else:
        df_all_mis = pd.DataFrame(all_mislabeled)
        print(df_all_mis[['Mes', 'Fecha', 'Cliente_Original', 'Monto', 'Tipo']].to_string(index=False))

audit_all_months()
