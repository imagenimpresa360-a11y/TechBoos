import csv
import os
import re

file_path = r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\marina\1.- enero boxmagic marina.csv'

def clean_val(v):
    return v.strip('"').strip(':').strip()

def analyze_sales():
    data = []
    with open(file_path, 'r', encoding='latin-1') as f:
        lines = f.readlines()
        
    for line in lines:
        line = line.strip()
        if not line: continue
        
        # Remove exterior quotes
        if line.startswith('"') and line.endswith('"'):
            line = line[1:-1]
        
        # Split by ," (which seems to be the separator)
        parts = line.split(',"')
        parts = [clean_val(p) for p in parts]
        data.append(parts)

    if not data: return
    
    header = data[0]
    rows = data[1:]
    
    # Create a dict-based summary
    total_recaudado = 0
    metodos = {}
    planes = {}
    
    # Find indices
    try:
        idx_monto = header.index('Monto')
        idx_tipo = header.index('Tipo')
        idx_plan = header.index('Plan')
    except ValueError:
        print("Header error:", header)
        return

    for row in rows:
        if len(row) <= idx_monto: continue
        
        monto_str = row[idx_monto].replace('$', '').replace('.', '').replace(' ', '')
        try:
            monto = int(monto_str)
        except:
            monto = 0
            
        total_recaudado += monto
        
        tipo = row[idx_tipo] if len(row) > idx_tipo else 'Desconocido'
        metodos[tipo] = metodos.get(tipo, 0) + monto
        
        plan = row[idx_plan] if len(row) > idx_plan else 'Desconocido'
        planes[plan] = planes.get(plan, 0) + monto

    print("="*50)
    print("RESUMEN DE VENTAS - MARINA - ENERO 2026")
    print("="*50)
    print(f"Total Recaudado:  ${total_recaudado:,.0f}".replace(',', '.'))
    print(f"Total Registros:   {len(rows)}")
    
    print("\nRECAUDACIÓN POR MÉTODO DE PAGO:")
    for m, t in sorted(metodos.items(), key=lambda x: x[1], reverse=True):
        print(f"- {m:15s}: ${t:,.0f}".replace(',', '.'))
        
    print("\nTOP 5 PLANES:")
    for p, t in sorted(planes.items(), key=lambda x: x[1], reverse=True)[:5]:
        print(f"- {p:30s}: ${t:,.0f}".replace(',', '.'))
    print("="*50)

if __name__ == "__main__":
    analyze_sales()
