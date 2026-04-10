import os
import glob
import pandas as pd
from datetime import datetime, timedelta

dir_boxmagic = r"c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\campanario"
dir_bci = r"C:\Users\DELL\Desktop\TECHEMPRESA\agentes\02_CFO_Finanzas\BANCO BCI\CARTOLAS_MENSUALES"

# 1. Leer BoxMagic Transferencias
boxmagic_data = []

def clean_amount(val):
    clean_str = str(val).replace('$', '').replace('.', '').replace('""', '').replace('"', '').strip()
    try:
        if not clean_str: return 0
        return int(clean_str)
    except:
        return 0

for m, file_prefix in [('Enero', '1.- enero'), ('Febrero', '2.- Febrero')]:
    archivos = glob.glob(os.path.join(dir_boxmagic, f'{file_prefix}*.csv'))
    if not archivos: continue
    archivo = archivos[0]
    
    with open(archivo, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    if len(lines) < 2: continue
    header_line = lines[0].strip().strip('"')
    headers = [h.replace('""', '').replace('"', '').replace(':', '').strip() for h in header_line.split(',')]
    
    idx_tipo = headers.index('Tipo')
    idx_monto = headers.index('Monto')
    idx_fecha = headers.index('Fecha de pago')
    idx_cli = headers.index('Cliente') if 'Cliente' in headers else headers.index('Cliente:') if 'Cliente:' in headers else -1
    
    for line in lines[1:]:
        line = line.strip().strip('"')
        if not line: continue
        cols = [c.replace('""', '').replace('"', '').strip() for c in line.split(',')]
        if len(cols) <= max(idx_tipo, idx_monto, idx_fecha): continue
        
        tipo = cols[idx_tipo].lower()
        monto = clean_amount(cols[idx_monto])
        fecha_str = cols[idx_fecha]
        cli = cols[idx_cli] if idx_cli != -1 else 'Desconocido'
        
        if 'transferencia' in tipo and monto > 0:
            boxmagic_data.append({
                'Mes': m,
                'Cliente': cli,
                'Fecha_Boxmagic': fecha_str,
                'Monto': monto
            })

# 2. Leer Cartolas BCI y Machear
for item in boxmagic_data:
    m = item['Mes']
    if m == 'Enero': bci_file = os.path.join(dir_bci, "1. CARTOLA ENERO N1.xlsx")
    else: bci_file = os.path.join(dir_bci, "2. CARTOLA FEBRERO N2.xlsx")
    
    match_found = False
    
    if os.path.exists(bci_file):
        try:
            # Leer excel ignorando filas vacias arribas
            df_bci = pd.read_excel(bci_file)
            
            # Buscar columnas probables
            col_abono = None
            col_fecha = None
            col_desc = None
            
            for c in df_bci.columns:
                c_lo = str(c).lower()
                if 'abono' in c_lo or 'credito' in c_lo: col_abono = c
                if 'fecha' in c_lo: col_fecha = c
                if 'descrip' in c_lo or 'detalle' in c_lo: col_desc = c
                
            # Si no las pilla en el header, puede estar más abajo
            if not col_abono:
                for i, row in df_bci.head(20).iterrows():
                    for idx, val in enumerate(row):
                        v_lo = str(val).lower()
                        if 'abono' in v_lo or 'crédito' in v_lo or 'credito' in v_lo:
                            df_bci.columns = df_bci.iloc[i]
                            df_bci = df_bci[i+1:].reset_index(drop=True)
                            for c in df_bci.columns:
                                c_lo = str(c).lower()
                                if 'abono' in c_lo or 'credito' in c_lo: col_abono = c
                                if 'fecha' in c_lo: col_fecha = c
                                if 'descrip' in c_lo or 'detalle' in c_lo: col_desc = c
                            break
                    if col_abono: break

            if col_abono:
                # Filtrar posibles matches
                df_bci['Monto_Lump'] = df_bci[col_abono].apply(clean_amount)
                matches_exactos = df_bci[df_bci['Monto_Lump'] == item['Monto']]
                
                if not matches_exactos.empty:
                    match_found = True
                    # Obteniendo detalles
                    detalles_bci = matches_exactos.iloc[0].to_dict()
                    item['Estado'] = 'CUADRADO'
                    item['Detalle_BCI'] = f"Encontrado Abono por ${item['Monto']}"
                else:
                    item['Estado'] = 'ALERTA ROJA - FUGA'
                    item['Detalle_BCI'] = 'No existe ningún depósito con este monto.'
            else:
                item['Estado'] = 'ERROR'
                item['Detalle_BCI'] = 'No se pudo leer formato BCI.'
        except Exception as e:
            item['Estado'] = 'ERROR'
            item['Detalle_BCI'] = str(e)
    else:
        item['Estado'] = 'ERROR'
        item['Detalle_BCI'] = 'Cartola no encontrada.'

print("\n==================================")
print(" RESULTADO DEL CRUCE FORENSE")
print("==================================\n")
for d in boxmagic_data:
    if d['Estado'] == 'CUADRADO':
        print(f"[OK] Transferencia BoxMagic reportada de ${d['Monto']} ({d['Cliente']} - {d['Fecha_Boxmagic']}) SI INGRESO AL BANCO.")
    else:
        print(f"[FUGA] Transferencia BoxMagic reportada de ${d['Monto']} ({d['Cliente']} - {d['Fecha_Boxmagic']}) NO ESTA EN EL BANCO BCI.")
        print(f"        -> Razon: {d['Detalle_BCI']}")
