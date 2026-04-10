import os
import glob
import pandas as pd

# Configuración de Rutas
sedes_paths = {
    'Campanario': r"c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\campanario",
    'Marina': r"c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\marina"
}
dir_bci = r"C:\Users\DELL\Desktop\TECHEMPRESA\agentes\02_CFO_Finanzas\BANCO BCI\CARTOLAS_MENSUALES"

# Lista Blanca (Autorizados por el Jefe)
WHITE_LIST = [
    'joaquin ortubia', 'fernanda mora', 'antonella rojas', 
    'carla pastene', 'javiera quelempan', 'francisca quelempan', 'mauro gonzalez'
]

def clean_amount(val):
    clean_str = str(val).replace('$', '').replace('.', '').replace('""', '').replace('"', '').replace(' ', '').strip()
    try:
        if not clean_str: return 0
        return int(clean_str)
    except:
        return 0

def normalize_name(name):
    return " ".join(str(name).lower().strip().split())

def consolidate_audit():
    meses_map = {
        'enero': '1. CARTOLA ENERO N1.xlsx',
        'febrero': '2. CARTOLA FEBRERO N2.xlsx',
        'marzo': '3. CARTOLA MARZO N3.xlsx'
    }

    final_results = []

    for sede_name, sede_path in sedes_paths.items():
        for mes_nombre, cartola_name in meses_map.items():
            # 1. Cargar Banco
            bci_path = os.path.join(dir_bci, cartola_name)
            bci_abonos = set()
            if os.path.exists(bci_path):
                try:
                    df_bci = pd.read_excel(bci_path)
                    col_abono = None
                    for i in range(15):
                        if i >= len(df_bci): break
                        if any('abono' in str(v).lower() or 'credito' in str(v).lower() for v in df_bci.iloc[i]):
                            df_bci.columns = df_bci.iloc[i]
                            df_bci = df_bci[i+1:]
                            cols = [c for c in df_bci.columns if 'abono' in str(c).lower() or 'credito' in str(c).lower()]
                            if cols: col_abono = cols[0]
                            break
                    if col_abono:
                        bci_abonos = set(df_bci[col_abono].apply(clean_amount).tolist())
                except: pass

            # 2. Cargar BoxMagic Detail
            archivos = glob.glob(os.path.join(sede_path, f"*{mes_nombre}*.csv"))
            if not archivos: continue
            
            try:
                with open(archivos[0], 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                if len(lines) < 2: continue
                header = [h.strip().strip('"').replace(':', '') for h in lines[0].split(',')]
                
                idx_cli = header.index('Cliente') if 'Cliente' in header else -1
                idx_monto = header.index('Monto') if 'Monto' in header else -1
                idx_tipo = header.index('Tipo') if 'Tipo' in header else -1

                seen = set() # para detectar duplicados EXACTOS (Nota de Credito)
                
                for line in lines[1:]:
                    cols = [c.strip().strip('"') for c in line.split(',')]
                    if len(cols) <= max(idx_cli, idx_monto, idx_tipo): continue
                    
                    cliente = cols[idx_cli]
                    cli_norm = normalize_name(cliente)
                    monto = clean_amount(cols[idx_monto])
                    tipo = cols[idx_tipo].lower()
                    
                    if monto <= 0: continue
                    if cli_norm in WHITE_LIST: continue
                    
                    # Logica Fuga: No es Webpay, y el monto NO esta en el BCI
                    if ('efectivo' in tipo or 'transferencia' in tipo):
                        if monto not in bci_abonos:
                            # Verificar duplicidad para no duplicar la fuga en el reporte
                            dup_key = (cli_norm, line)
                            if dup_key in seen:
                                # Es una Nota de Credito necesaria, pero ya la contamos una vez (o es error de digitación)
                                continue
                            seen.add(dup_key)
                            
                            final_results.append({
                                'Sede': sede_name,
                                'Mes': mes_nombre.capitalize(),
                                'Cliente': cliente,
                                'Monto': monto,
                                'Tipo': tipo.capitalize()
                            })
            except: pass

    df = pd.DataFrame(final_results)
    
    print("\n" + "="*50)
    print(" INFORME CONSOLIDADO DE FUGAS (Q1 - 2026)")
    print("="*50)
    
    resumen = df.groupby(['Sede', 'Mes'])['Monto'].agg(['sum', 'count']).rename(columns={'sum': 'Total_Perdido', 'count': 'Cant_Casos'})
    print(resumen)
    
    print("\n" + "="*50)
    print(" TOTAL GENERAL POR SEDE")
    print("="*50)
    total_sede = df.groupby('Sede')['Monto'].sum().apply(lambda x: f"${x:,}")
    print(total_sede)
    
    print("\n" + "="*50)
    print(" GRAN TOTAL EMPRESA (Fuga Estimada): " + f"${df['Monto'].sum():,}")
    print("="*50)

    # Guardar en Excel
    out_file = r"c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\auditoria_fugas\INFORME_CONSOLIDADO_Q1.xlsx"
    df.to_excel(out_file, index=False)
    print(f"\nReporte completo guardado en: {out_file}")

consolidate_audit()
