import os
import glob
import pandas as pd

# Directorios
dir_bci = r"C:\Users\DELL\Desktop\TECHEMPRESA\agentes\02_CFO_Finanzas\BANCO BCI\CARTOLAS_MENSUALES"
dir_boxmagic_camp = r"c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\campanario"
dir_boxmagic_mar = r"c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\marina"
dir_vpos = r"C:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\VIRTUAL POST"
out_report = r"c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\auditoria_fugas\INGRESOS_NO_IDENTIFICADOS_ENERO.xlsx"

def clean_amount(val):
    clean_str = str(val).replace('$', '').replace('.', '').replace('""', '').replace('"', '').replace(' ', '').strip()
    try:
        if not clean_str: return 0
        return int(float(clean_str))
    except:
        return 0

def deep_inverse_audit_january():
    print("Iniciando Auditoria Inversa (Ingresos BCI sin respaldo en sistemas)...")
    
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

    # 2. Recolectar montos VirtualPOS Enero
    vp_amounts = set()
    for arc in glob.glob(os.path.join(dir_vpos, "*enero*.xlsx")):
        try:
            df_vp = pd.read_excel(arc)
            col_monto = None
            for c in df_vp.columns:
                if 'monto' in str(c).lower() or 'total' in str(c).lower(): col_monto = c
            if not col_monto:
                for c in df_vp.columns:
                    if 'pagado' in str(c).lower(): col_monto = c
            
            if col_monto:
                for val in df_vp[col_monto]:
                    amt = clean_amount(val)
                    if amt > 0: vp_amounts.add(amt)
        except: pass

    # 3. Analizar BCI Enero
    bci_file = os.path.join(dir_bci, "1. CARTOLA ENERO N1.xlsx")
    unmatched_incomes = []
    
    try:
        df_bci = pd.read_excel(bci_file)
        # Buscar "abono"
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
        
        if col_abono:
            for idx, row in df_bci.iterrows():
                amt = clean_amount(row[col_abono])
                if amt > 0:
                    row_str = " ".join([str(v).upper() for v in row.values])
                    
                    # Filtramos ignorando abonos de transacciones masivas/comisiones/tarjetas
                    ignore_keywords = ['TRANSBANK', 'GETNET', 'WEBPAY', 'MERCADOPAGO', 'PAGO PROVEEDOR', 'FLOW', 'COMISION']
                    if any(kw in row_str for kw in ignore_keywords):
                        continue
                        
                    # Si el abono proviene de una cuenta corriente o deposito en efectivo
                    if 'TRANSFER DE' in row_str or 'DEPOSITO' in row_str or 'TRASPASO' in row_str or 'ABONO' in row_str:
                        if amt not in bm_amounts and amt not in vp_amounts:
                            # Reconstruir detalle de la transacción
                            fecha = row[df_bci.columns[0]] if len(df_bci.columns)>0 else "S/F"
                            desc_col = None
                            for c in df_bci.columns:
                                if 'desc' in str(c).lower() or 'detalle' in str(c).lower(): desc_col = c
                                
                            detalle_desc = row[desc_col] if desc_col else " ".join([str(x) for x in row.values if isinstance(x, str) and 'TRANSFER' in x.upper()])
                            if not detalle_desc: detalle_desc = row_str
                            
                            unmatched_incomes.append({
                                'Fecha Banco': fecha,
                                'Monto Ingresado': amt,
                                'Detalle BCI': detalle_desc,
                                'Estado': 'PAGO "FANTASMA" (No registrado en BoxMagic ni VirtualPOS)'
                            })
                            
    except Exception as e:
        print(f"Error procesando BCI: {e}")

    # Output
    if unmatched_incomes:
        df_unmatched = pd.DataFrame(unmatched_incomes)
        df_unmatched.to_excel(out_report, index=False)
        print(f"=== RESULTADO AUDITORIA INVERSA ENERO ===")
        print(f"Total de pagos recibidos en banco sin registro en sistema: {len(df_unmatched)}")
        print(f"Monto total no identificado: ${df_unmatched['Monto Ingresado'].sum():,}")
        print("\nTOP 15 Pagos más grandes sin registro:")
        print(df_unmatched.sort_values(by='Monto Ingresado', ascending=False).head(15).to_string(index=False))
        print(f"\nReporte completo guardado en: {out_report}")
    else:
        print("Tranquilidad: Todos los transferencias/depósitos individuales en BCI tienen un match de monto en BoxMagic/VirtualPOS.")

deep_inverse_audit_january()
