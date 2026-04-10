import os
import glob
import pandas as pd

# Directorios
dir_boxmagic_marina = r"c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\marina"
dir_bci = r"C:\Users\DELL\Desktop\TECHEMPRESA\agentes\02_CFO_Finanzas\BANCO BCI\CARTOLAS_MENSUALES"
dir_reportes = r"c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\auditoria_fugas\Marina"

def clean_amount(val):
    clean_str = str(val).replace('$', '').replace('.', '').replace('""', '').replace('"', '').replace(' ', '').strip()
    try:
        if not clean_str: return 0
        return int(clean_str)
    except:
        return 0

def normalize_name(name):
    return " ".join(str(name).lower().strip().split())

def protocol_sentinel_marina():
    if not os.path.exists(dir_reportes): os.makedirs(dir_reportes)
    
    meses_map = {
        'enero': '1. CARTOLA ENERO N1.xlsx',
        'febrero': '2. CARTOLA FEBRERO N2.xlsx',
        'marzo': '3. CARTOLA MARZO N3.xlsx'
    }
    
    final_audit = []

    for mes_nombre, cartola_name in meses_map.items():
        # 1. Cargar BCI
        bci_path = os.path.join(dir_bci, cartola_name)
        bci_records = []
        if os.path.exists(bci_path):
            try:
                df_bci = pd.read_excel(bci_path)
                col_abono = None
                for i in range(15):
                    row = df_bci.iloc[i]
                    if any('abono' in str(v).lower() or 'credito' in str(v).lower() for v in row):
                        df_bci.columns = df_bci.iloc[i]
                        df_bci = df_bci[i+1:].reset_index(drop=True)
                        cols = [c for c in df_bci.columns if 'abono' in str(c).lower() or 'credito' in str(c).lower()]
                        if cols: col_abono = cols[0]
                        break
                
                if col_abono:
                    for idx, row in df_bci.iterrows():
                        amt = clean_amount(row[col_abono])
                        if amt > 0:
                            bci_records.append({'Monto': amt, 'Original': str(row.to_dict())})
            except: pass

        # 2. Cargar BoxMagic Marina
        archivos_bm = glob.glob(os.path.join(dir_boxmagic_marina, f"*{mes_nombre}*.csv"))
        if not archivos_bm: continue
        
        with open(archivos_bm[0], 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        if len(lines) < 2: continue
        header = [h.strip().strip('"').replace(':', '') for h in lines[0].split(',')]
        idx_cli = header.index('Cliente') if 'Cliente' in header else -1
        idx_monto = header.index('Monto') if 'Monto' in header else -1
        idx_tipo = header.index('Tipo') if 'Tipo' in header else -1
        idx_fecha = header.index('Fecha de pago') if 'Fecha de pago' in header else -1
        idx_vend = header.index('Vendedor/a') if 'Vendedor/a' in header else -1

        for line in lines[1:]:
            cols = [c.strip().strip('"') for c in line.split(',')]
            if len(cols) <= max(idx_cli, idx_monto, idx_tipo, idx_fecha): continue
            
            monto = clean_amount(cols[idx_monto])
            tipo = cols[idx_tipo].lower()
            cliente = cols[idx_cli]
            fecha = cols[idx_fecha]
            vendedor = cols[idx_vend] if idx_vend != -1 else 'Desconocido'

            if ('efectivo' in tipo or 'transferencia' in tipo) and monto > 0:
                # BUSQUEDA 1 A 1
                found = False
                for b_rec in bci_records:
                    if b_rec['Monto'] == monto:
                        # Si el monto coincide, asumimos que "podria" estar en el banco
                        found = True
                        break
                
                if not found:
                    final_audit.append({
                        'Mes': mes_nombre.capitalize(),
                        'Fecha': fecha,
                        'Cliente': cliente,
                        'Monto': monto,
                        'Tipo_Reportado': tipo.capitalize(),
                        'Vendedor': vendedor,
                        'Estado': 'FUGA NO DETECTADA EN BANCO'
                    })

    if final_audit:
        df_final = pd.DataFrame(final_audit)
        out_excel = os.path.join(dir_reportes, "REPORTE_FUGAS_MARINA_PRO-1A1.xlsx")
        df_final.to_excel(out_excel, index=False)
        print(f"=== PROTOCOLO SENTINEL 1-A-1 FINALIZADO PARA MARINA ===")
        print(f"Hallazgos confirmados: {len(df_final)}")
        print(f"Reporte generado en: {out_excel}")
        print("\nDetalle de las principales fugas encontradas:")
        print(df_final.head(15).to_string(index=False))
    else:
        print("No se detectaron fugas con el protocolo 1-a-1 en Marina.")

protocol_sentinel_marina()
