import os
import glob
import pandas as pd

base_dir = r"c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic"
sedes = ['campanario'] # Marina solo tiene resumenes

def clean_amount(val):
    clean_str = str(val).replace('$', '').replace('.', '').replace(' ', '').replace('""', '').replace('"', '').strip()
    try:
        if clean_str == '': return 0
        return int(clean_str)
    except:
        return 0

detalles_efectivo = []

for sede in sedes:
    archivos = glob.glob(os.path.join(base_dir, sede, '*.csv'))
    for archivo in archivos:
        try:
            with open(archivo, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            if len(lines) < 2: continue
            
            header_line = lines[0].strip().strip('"')
            headers = [h.replace('""', '').replace('"', '').replace(':', '').strip() for h in header_line.split(',')]
            
            if 'Tipo' not in headers or 'Monto' not in headers: continue

            idx_tipo = headers.index('Tipo')
            idx_monto = headers.index('Monto')
            idx_vendedor = headers.index('Vendedor/a') if 'Vendedor/a' in headers else headers.index('Vendedor') if 'Vendedor' in headers else -1
            idx_cliente = headers.index('Cliente') if 'Cliente' in headers else headers.index('Cliente:') if 'Cliente:' in headers else -1
            idx_fecha = headers.index('Fecha de pago') if 'Fecha de pago' in headers else -1
            idx_plan = headers.index('Plan') if 'Plan' in headers else -1

            for line in lines[1:]:
                line = line.strip().strip('"')
                if not line: continue
                cols = [c.replace('""', '').replace('"', '').strip() for c in line.split(',')]
                
                if len(cols) <= max(idx_tipo, idx_monto): continue
                
                tipo = cols[idx_tipo].lower()
                monto = clean_amount(cols[idx_monto])
                
                if 'efectivo' in tipo and monto > 0:
                    vendedor = cols[idx_vendedor] if idx_vendedor != -1 and len(cols) > idx_vendedor else 'Desconocido'
                    cliente = cols[idx_cliente] if idx_cliente != -1 and len(cols) > idx_cliente else 'Desconocido'
                    fecha = cols[idx_fecha] if idx_fecha != -1 and len(cols) > idx_fecha else 'S/F'
                    plan = cols[idx_plan] if idx_plan != -1 and len(cols) > idx_plan else 'S/P'
                    
                    detalles_efectivo.append({
                        'Fecha': fecha,
                        'Cliente': cliente,
                        'Plan': plan,
                        'Monto': monto,
                        'Vendedor': vendedor,
                        'Mes': 'Enero' if 'enero' in archivo.lower() else 'Febrero' if 'febrero' in archivo.lower() else 'Otro'
                    })
        except:
            pass

df = pd.DataFrame(detalles_efectivo)
df = df.sort_values(by=['Mes', 'Fecha'])

print("\n=== DETALLE DE PAGOS EN EFECTIVO ($1.5M RECIBIDOS) ===")
print(df.to_string(index=False))

print("\nTOTAL POR VENDEDOR EN EFECTIVO:")
print(df.groupby('Vendedor')['Monto'].sum().apply(lambda x: f"${x:,}").reset_index())
