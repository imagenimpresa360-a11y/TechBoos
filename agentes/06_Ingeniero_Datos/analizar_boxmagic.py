import os
import glob
import pandas as pd
import csv

base_dir = r"c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic"
sedes = ['campanario', 'marina']

resultados = []

def clean_amount(val):
    clean_str = str(val).replace('$', '').replace('.', '').replace(' ', '').replace('""', '').replace('"', '').strip()
    try:
        if clean_str == '': return 0
        return int(clean_str)
    except:
        return 0

for sede in sedes:
    archivos = glob.glob(os.path.join(base_dir, sede, '*.csv'))
    for archivo in archivos:
        mes_label = 'Desconocido'
        for m in ['enero', 'febrero', 'marzo', 'abril']:
            if m in archivo.lower():
                mes_label = m.capitalize()
                break
                
        try:
            # Leer raw lines
            with open(archivo, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                
            if len(lines) < 2: continue
                
            # Limpiar el encabezado: "N°,""Cliente:"",""Email:""...
            header_line = lines[0].strip()
            # Removiendo comillas extrañas al inicio y final
            if header_line.startswith('"'): header_line = header_line[1:]
            if header_line.endswith('"'): header_line = header_line[:-1]
            
            headers = [h.replace('""', '').replace('"', '').replace(':', '').strip() for h in header_line.split(',')]
            
            # Buscar índices
            try:
                idx_tipo = headers.index('Tipo')
                idx_monto = headers.index('Monto')
                idx_vend = headers.index('Vendedor/a') if 'Vendedor/a' in headers else -1
            except ValueError:
                continue # No as a valid file

            for line in lines[1:]:
                line = line.strip()
                if not line: continue
                
                if line.startswith('"'): line = line[1:]
                if line.endswith('"'): line = line[:-1]
                
                cols = [c.replace('""', '').replace('"', '').strip() for c in line.split(',')]
                
                if len(cols) <= max(idx_tipo, idx_monto): continue
                
                tipo = cols[idx_tipo].lower()
                monto = clean_amount(cols[idx_monto])
                vendedor = cols[idx_vend] if idx_vend != -1 and len(cols) > idx_vend else 'Desconocido'
                
                if 'efectivo' in tipo: cls_tipo = 'Efectivo'
                elif 'transferencia' in tipo: cls_tipo = 'Transferencia'
                elif 'webpay' in tipo or 'tarjeta' in tipo: cls_tipo = 'Tarjetas_Webpay'
                else: cls_tipo = 'Otro'
                
                resultados.append({
                    'Sede': sede.capitalize(),
                    'Mes': mes_label,
                    'Tipo': cls_tipo,
                    'Monto': monto,
                    'Vendedor': vendedor,
                    'Archivo': os.path.basename(archivo)
                })
        except Exception as e:
            print(f"Error procesando {archivo}: {e}")

df_res = pd.DataFrame(resultados)

if df_res.empty:
    print("NO SE ENCONTRARON DATOS VÁLIDOS")
else:
    print("\n=== RESUMEN DE PAGOS SOSPECHOSOS (EFECTIVO Y TRANSFERENCIA) ===")
    print("TOTALES POR SEDE Y TIPO (Todos los meses):")
    resumen = df_res.groupby(['Sede', 'Mes', 'Tipo'], observed=True)['Monto'].sum().reset_index()
    print(resumen.to_string(index=False))

    print("\n--- ANALISIS DE RESPONSABILIDAD HUMANA (VENDEDORES CON CASH/TRANSF) ---")
    vendedores = df_res[df_res['Tipo'].isin(['Efectivo', 'Transferencia'])].groupby(['Vendedor', 'Tipo'], observed=True)['Monto'].sum().reset_index()
    vendedores = vendedores.sort_values(by='Monto', ascending=False)
    print(vendedores.to_string(index=False))
