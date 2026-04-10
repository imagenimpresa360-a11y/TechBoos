import os
import glob
import pandas as pd

# Directorios
dir_boxmagic = r"c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\campanario"
dir_bci = r"C:\Users\DELL\Desktop\TECHEMPRESA\agentes\02_CFO_Finanzas\BANCO BCI\CARTOLAS_MENSUALES"
dir_output_base = r"c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\auditoria_fugas"

def clean_amount(val):
    clean_str = str(val).replace('$', '').replace('.', '').replace('""', '').replace('"', '').strip()
    try:
        if not clean_str: return 0
        return int(clean_str)
    except:
        return 0

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def generate_audit_january():
    # 1. Cargar Cartola BCI Enero
    bci_file = os.path.join(dir_bci, "1. CARTOLA ENERO N1.xlsx")
    try:
        df_bci = pd.read_excel(bci_file)
        # Buscar columna monto (Abonos)
        col_abono = None
        for c in df_bci.columns:
            if 'abono' in str(c).lower() or 'credito' in str(c).lower():
                col_abono = c
                break
        if not col_abono:
             # Re-intentar buscando en las primeras filas
             for i in range(10):
                row = df_bci.iloc[i]
                for idx, val in enumerate(row):
                    if 'abono' in str(val).lower():
                        df_bci.columns = df_bci.iloc[i]
                        df_bci = df_bci[i+1:]
                        col_abono = [c for c in df_bci.columns if 'abono' in str(c).lower()][0]
                        break
                if col_abono: break
        
        bci_abonos = df_bci[col_abono].apply(clean_amount).tolist()
    except Exception as e:
        print(f"Error cargando BCI: {e}")
        return

    # 2. Cargar BoxMagic Enero
    archivo_bm = glob.glob(os.path.join(dir_boxmagic, "1.- enero*.csv"))[0]
    with open(archivo_bm, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    header = lines[0].strip().strip('"').split(',')
    headers = [h.replace('""', '').replace('"', '').replace(':', '').strip() for h in header]
    
    idx_tipo = headers.index('Tipo')
    idx_monto = headers.index('Monto')
    idx_cli = headers.index('Cliente') if 'Cliente' in headers else headers.index('Cliente:') if 'Cliente:' in headers else -1
    idx_fecha = headers.index('Fecha de pago')

    audit_records = []
    
    for line in lines[1:]:
        cols = [c.replace('""', '').replace('"', '').strip() for c in line.strip().strip('"').split(',')]
        if len(cols) <= max(idx_tipo, idx_monto): continue
        
        tipo = cols[idx_tipo].lower()
        monto = clean_amount(cols[idx_monto])
        cliente = cols[idx_cli] if idx_cli != -1 else 'S/N'
        fecha = cols[idx_fecha]
        
        if 'transferencia' in tipo and monto > 0:
            if monto not in bci_abonos:
                audit_records.append({
                    'Fecha': fecha,
                    'Alumno/Cliente': cliente,
                    'Monto': monto,
                    'Tipo': 'TRANSFERENCIA',
                    'Hallazgo': 'NO EXISTE ABONO EN BANCO BCI'
                })
        elif 'efectivo' in tipo and monto > 0:
            # Los efectivos siempre son hallazgos de riesgo si no hay deposito
             audit_records.append({
                    'Fecha': fecha,
                    'Alumno/Cliente': cliente,
                    'Monto': monto,
                    'Tipo': 'EFECTIVO',
                    'Hallazgo': 'EFECTIVO SIN DEPOSITO ANALIZADO'
                })

    if audit_records:
        df_audit = pd.DataFrame(audit_records)
        out_path = os.path.join(dir_output_base, "Campanario", "Enero")
        ensure_dir(out_path)
        file_name = os.path.join(out_path, "REPORTE_FUGAS_ENERO.xlsx")
        df_audit.to_excel(file_name, index=False)
        print(f"Reporte generado en: {file_name}")
        print("\n=== ALUMNOS CON IRREGULARIDADES EN ENERO (CAMPANARIO) ===")
        print(df_audit.to_string(index=False))

generate_audit_january()
