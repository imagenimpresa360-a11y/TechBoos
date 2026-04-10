import os
import glob
import pandas as pd

# Directorios
dir_bci = r"C:\Users\DELL\Desktop\TECHEMPRESA\agentes\02_CFO_Finanzas\BANCO BCI\CARTOLAS_MENSUALES"
dir_boxmagic_camp = r"c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\campanario"
dir_boxmagic_mar = r"c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\marina"
dir_vpos = r"C:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\VIRTUAL POST"

def clean_amount(val):
    if pd.isna(val): return 0
    clean_str = str(val).replace('$', '').replace('.', '').replace('""', '').replace('"', '').replace(' ', '').strip()
    try:
        return int(float(clean_str))
    except:
        return 0

def inverse_audit():
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

    # Virtualpos
    vp_amounts = set()
    for arc in glob.glob(os.path.join(dir_vpos, "*enero*.xlsx")):
        try:
            df_vp = pd.read_excel(arc)
            col_monto = None
            for c in df_vp.columns:
                if 'monto' in str(c).lower() or 'total' in str(c).lower() or 'pagado' in str(c).lower(): col_monto = c
            if col_monto:
                for val in df_vp[col_monto]:
                    amt = clean_amount(val)
                    if amt > 0: vp_amounts.add(amt)
        except: pass

    # Analizar BCI
    bci_file = os.path.join(dir_bci, "1. CARTOLA ENERO N1.xlsx")
    unmatched_incomes = []
    
    try:
        df_bci = pd.read_excel(bci_file)
        
        all_transfers_count = 0
        total_unmatched_value = 0
        
        for i, row in df_bci.iterrows():
            # En estas cartolas BCI, Unnamed: 10 es el ABONO y Unnamed: 5 es la DESCRIPCION
            if 'Unnamed: 10' not in df_bci.columns or 'Unnamed: 5' not in df_bci.columns: continue
            
            amt_val = row['Unnamed: 10']
            desc_val = str(row['Unnamed: 5']).upper()
            fecha = str(row['Unnamed: 0'])
            
            amt = clean_amount(amt_val)
            if amt > 0:
                # Filtrar transacciones masivas/bancarias
                ignore_kw = ['TRANSBANK', 'GETNET', 'WEBPAY', 'MERCADOPAGO', 'COMISION', 'DEVOLUCION', 'REVERSO', 'FLOW', 'PAYU', 'PAGO PROVEEDORES', 'PAGO IMPUESTOS']
                if any(kw in desc_val for kw in ignore_kw): continue
                
                # Tambien ignorar si es un abono interno (ej un prestamo o traspaso de otra cuenta de la empresa)
                if 'PAGO NOMINA' in desc_val: continue
                
                if 'TRANSFER' in desc_val or 'DEPOSITO' in desc_val or 'ABONO' in desc_val or 'TRASPASO' in desc_val:
                    all_transfers_count += 1
                    
                    if amt not in bm_amounts and amt not in vp_amounts:
                        total_unmatched_value += amt
                        unmatched_incomes.append({
                            'Fecha': fecha,
                            'Monto': amt,
                            'Detalle': desc_val
                        })
                        
    except Exception as e:
        print(f"Error procesando BCI: {e}")

    print(f"Total depositos individuales analizados en Enero (BCI): {all_transfers_count}")
    if unmatched_incomes:
        df_unmatched = pd.DataFrame(unmatched_incomes)
        print(f"Total de pagos en banco SIN REGISTRO en (BoxMagic/VirtualPOS): {len(df_unmatched)}")
        print(f"Valor total de este 'Dinero Fantasma': ${total_unmatched_value:,}")
        
        out_report = r"c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\auditoria_fugas\INGRESOS_NO_IDENTIFICADOS_ENERO.xlsx"
        df_unmatched.to_excel(out_report, index=False)
        
        print("\nTOP 15 Pagos más grandes sin registro:")
        print(df_unmatched.sort_values(by='Monto', ascending=False).head(15).to_string(index=False))
        print(f"\nLista completa guardada en: {out_report}")
    else:
        print("Todo perfecto. No hay dinero ingresado en el banco que no este en sistema.")

inverse_audit()
