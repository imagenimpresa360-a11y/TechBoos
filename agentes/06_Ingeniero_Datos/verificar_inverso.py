import os
import glob
import pandas as pd

# Directorios
dir_bci = r"C:\Users\DELL\Desktop\TECHEMPRESA\agentes\02_CFO_Finanzas\BANCO BCI\CARTOLAS_MENSUALES"
dir_boxmagic_camp = r"c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\campanario"
dir_boxmagic_mar = r"c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\marina"

def clean_amount(val):
    clean_str = str(val).replace('$', '').replace('.', '').replace('""', '').replace('"', '').replace(' ', '').strip()
    try:
        if not clean_str: return 0
        return int(float(clean_str))
    except:
        return 0

def deep_inverse_audit_january():
    
    # 1. Recolectar montos BoxMagic Enero
    bm_amounts = set()
    for d in [dir_boxmagic_camp, dir_boxmagic_mar]:
        for arc in glob.glob(os.path.join(d, "*enero*.csv")):
            try:
                with open(arc, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                if len(lines) < 2: continue
                header = [h.strip().strip('"').replace(':', '') for h in lines[0].split(',')]
                idx_monto = header.index('Monto') if 'Monto' in header else -1
                if idx_monto != -1:
                    for line in lines[1:]:
                        cols = [c.strip().strip('"') for c in line.split(',')]
                        if len(cols) > idx_monto:
                            amt = clean_amount(cols[idx_monto])
                            if amt > 0: bm_amounts.add(amt)
            except: pass

    # 3. Analizar BCI Enero
    bci_file = os.path.join(dir_bci, "1. CARTOLA ENERO N1.xlsx")
    unmatched_incomes = []
    
    try:
        df_bci = pd.read_excel(bci_file)
        col_abono = None
        for i in range(15):
            if i >= len(df_bci): break
            row = df_bci.iloc[i]
            if any('abono' in str(v).lower() for v in row):
                df_bci.columns = df_bci.iloc[i]
                df_bci = df_bci[i+1:].reset_index(drop=True)
                cols_abono = [c for c in df_bci.columns if 'abono' in str(c).lower() or 'credito' in str(c).lower()]
                if cols_abono: col_abono = cols_abono[0]
                break
        
        all_transfers_count = 0
        if col_abono:
            for idx, row in df_bci.iterrows():
                amt = clean_amount(row[col_abono])
                if amt > 0:
                    row_str = " ".join([str(v).upper() for v in row.values])
                    ignore_keywords = ['TRANSBANK', 'GETNET', 'WEBPAY', 'MERCADOPAGO']
                    if any(kw in row_str for kw in ignore_keywords): continue
                        
                    if 'TRANSFER' in row_str or 'ABONO' in row_str:
                        all_transfers_count += 1
                        if amt not in bm_amounts:
                            fecha = row[df_bci.columns[0]]
                            unmatched_incomes.append({
                                'Fecha': fecha,
                                'Monto': amt,
                                'Detalle': row_str[:150]
                            })
                            
    except Exception as e:
        print(f"Error procesando BCI: {e}")

    print(f"Total transferencias individuales analizadas en Enero: {all_transfers_count}")
    if unmatched_incomes:
        df_unmatched = pd.DataFrame(unmatched_incomes)
        print(f"Total de pagos recibidos en banco sin registro BoxMagic (excluyendo VirtualPOS): {len(df_unmatched)}")
        print("\nTOP Pagos no registrados (Muestra 10):")
        print(df_unmatched.head(10).to_string(index=False))
    else:
        print("Tranquilidad: Todo esta cuadrado con BoxMagic.")

deep_inverse_audit_january()
