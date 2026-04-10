import os
import glob
import pandas as pd

base_dir = r"c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic"
sedes = ['campanario', 'marina']

resultados_cero = []
resultados_fugas = []

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
        try:
            with open(archivo, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            if len(lines) < 2: continue
            
            header_line = lines[0].strip().strip('"')
            headers = [h.replace('""', '').replace('"', '').replace(':', '').strip() for h in header_line.split(',')]
            
            if 'Plan' not in headers or 'Monto' not in headers:
                continue # Probablemente es un archivo de resumen (como los de Marina)

            idx_plan = headers.index('Plan')
            idx_monto = headers.index('Monto')
            idx_vendedor = headers.index('Vendedor/a') if 'Vendedor/a' in headers else headers.index('Vendedor') if 'Vendedor' in headers else -1
            idx_cliente = headers.index('Cliente') if 'Cliente' in headers else headers.index('Cliente:') if 'Cliente:' in headers else -1
            idx_fecha = headers.index('Fecha de pago') if 'Fecha de pago' in headers else -1

            for line in lines[1:]:
                line = line.strip().strip('"')
                if not line: continue
                cols = [c.replace('""', '').replace('"', '').strip() for c in line.split(',')]
                
                if len(cols) <= max(idx_plan, idx_monto): continue
                
                monto = clean_amount(cols[idx_monto])
                plan = cols[idx_plan]
                vendedor = cols[idx_vendedor] if idx_vendedor != -1 and len(cols) > idx_vendedor else 'Desconocido'
                cliente = cols[idx_cliente] if idx_cliente != -1 and len(cols) > idx_cliente else 'Desconocido'
                fecha = cols[idx_fecha] if idx_fecha != -1 and len(cols) > idx_fecha else 'S/F'

                if monto == 0:
                    resultados_cero.append({
                        'Sede': sede.capitalize(),
                        'Fecha': fecha,
                        'Cliente': cliente,
                        'Plan': plan,
                        'Vendedor': vendedor
                    })
                    
        except Exception as e:
            pass

print("\n=== LISTADO DE PLANES CON VALOR $0 (CORTESIAS / ADMINISTRATIVOS) ===")
if not resultados_cero:
    print("No se encontraron registros.")
else:
    df_cero = pd.DataFrame(resultados_cero)
    print(df_cero.to_string(index=False))

print("\n\nRESUMEN POR VENDEDOR (CUANTOS PLANES $0 REGISTRO CADA UNO):")
if not df_cero.empty:
    resumen_vend = df_cero.groupby(['Vendedor']).size().reset_index(name='Cantidad_Planes_Cero')
    print(resumen_vend.to_string(index=False))
