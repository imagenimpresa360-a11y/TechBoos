import os
import glob
import pandas as pd

# Directorios
dir_boxmagic = r"c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\campanario"

def clean_amount(val):
    clean_str = str(val).replace('$', '').replace('.', '').replace('""', '').replace('"', '').replace(' ', '').strip()
    try:
        if not clean_str: return 0
        return int(clean_str)
    except:
        return 0

def generate_full_manual_list():
    archivos = glob.glob(os.path.join(dir_boxmagic, "*.csv"))
    all_data = []

    for arc in archivos:
        mes_label = "Desconocido"
        for m in ['enero', 'febrero', 'marzo', 'abril']:
            if m in arc.lower(): 
                mes_label = m.capitalize()
                break
        
        try:
            with open(arc, 'r', encoding='utf-8') as f:
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
                
                # Solo queremos Efectivo y Transferencia (Lo que no es Webpay/Tarjeta)
                if 'efectivo' in tipo or 'transferencia' in tipo:
                    all_data.append({
                        'Mes': mes_label,
                        'Fecha': cols[idx_fecha],
                        'Cliente': cols[idx_cli],
                        'Monto_BoxMagic': monto,
                        'Tipo_Reportado': tipo.capitalize(),
                        'Vendedor': cols[idx_vend] if idx_vend != -1 else 'N/A'
                    })
        except: pass

    df = pd.DataFrame(all_data)
    df = df.sort_values(by=['Mes', 'Fecha'])
    
    out_file = r"c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\auditoria_fugas\LISTA_PAGOS_MANUALES_CAMPANARIO.xlsx"
    df.to_excel(out_file, index=False)
    
    print(f"=== LISTA DE CARGA MANUAL (EFECTIVO/TRANSF) GENERADA ===")
    print(f"Archivo: {out_file}")
    print(f"Total registros encontrados: {len(df)}")
    print("\nPrimeros 20 registros para revision rapida:")
    print(df.head(20).to_string(index=False))

generate_full_manual_list()
