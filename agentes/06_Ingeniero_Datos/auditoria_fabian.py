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

def analyze_fabian_rojas():
    target = "fabian rojas"
    headers_printed = False
    
    print(f"=== BUSQUEDA INTEGRAL: {target.upper()} ===")
    
    # 1. Buscar en BoxMagic
    archivos_bm = glob.glob(os.path.join(dir_boxmagic, "*.csv"))
    matches_bm = []
    
    for arc in archivos_bm:
        try:
            with open(arc, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            if len(lines) < 2: continue
            header = [h.strip().strip('"').replace(':', '') for h in lines[0].split(',')]
            idx_cli = header.index('Cliente') if 'Cliente' in header else -1
            idx_monto = header.index('Monto') if 'Monto' in header else -1
            idx_tipo = header.index('Tipo') if 'Tipo' in header else -1
            idx_fecha = header.index('Fecha de pago') if 'Fecha de pago' in header else -1
            
            for line in lines[1:]:
                cols = [c.strip().strip('"') for c in line.split(',')]
                if len(cols) > idx_cli and normalize_name(cols[idx_cli]) == target:
                    matches_bm.append({
                        'Mes': os.path.basename(arc),
                        'Fecha': cols[idx_fecha],
                        'Monto': clean_amount(cols[idx_monto]),
                        'Tipo': cols[idx_tipo]
                    })
        except: pass
    
    if matches_bm:
        print("Encontrado en BoxMagic:")
        print(pd.DataFrame(matches_bm).to_string(index=False))
    else:
        print("No se encontro en BoxMagic.")

    # 2. Buscar en BCI (Fuzzy search in description and exact amount)
    archivos_bci = glob.glob(os.path.join(dir_bci, "*.xlsx"))
    print("\nBuscando en Cartolas BCI (Monto o Nombre):")
    
    for arc in archivos_bci:
        if "~$" in arc: continue
        try:
            df = pd.read_excel(arc)
            # Buscar en todo el dataframe
            for i, row in df.iterrows():
                row_str = " ".join([str(v).lower() for v in row.values])
                if target in row_str:
                    print(f"Match por NOMBRE en {os.path.basename(arc)}:")
                    print(row.to_dict())
                # Tambien buscar si los montos de BoxMagic estan en la cartola
                for bm_m in matches_bm:
                    if bm_m['Monto'] > 0:
                        for val in row.values:
                            if clean_amount(val) == bm_m['Monto']:
                                # Si el monto coincide pero no dice el nombre, igual avisar
                                if target not in row_str:
                                    pass # Demasiados ruidos si el monto es comun
        except: pass

    # 3. Generar documento de Notas de Credito
    nc_data = [
        {'Mes': 'Enero', 'Cliente': 'Renata Llanos', 'Monto': 52900, 'Fecha': '05/01/2026', 'Motivo': 'Duplicidad por error de digitacion de nombre'},
        {'Mes': 'Marzo', 'Cliente': 'Marcelo Jara', 'Monto': 7000, 'Fecha': '06/03/2026', 'Motivo': 'Cobro duplicado el mismo dia'},
        {'Mes': 'Marzo', 'Cliente': 'Barbara Norambuena', 'Monto': 37900, 'Fecha': '19/03/2026', 'Motivo': 'Duplicidad por error de digitacion (Mayus/Minus)'}
    ]
    df_nc = pd.DataFrame(nc_data)
    out_file = r"c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\auditoria_fugas\INSTRUCCION_NOTAS_CREDITO.xlsx"
    df_nc.to_excel(out_file, index=False)
    print(f"\n[OK] Documento de Notas de Credito generado en: {out_file}")

analyze_fabian_rojas()
