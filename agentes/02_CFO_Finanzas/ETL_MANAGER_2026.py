
import os
import json
import pandas as pd
import io

ROOT_DIR = r'c:\Users\DELL\Desktop\TECHEMPRESA'
DB_PATH = os.path.join(ROOT_DIR, 'agentes', '02_CFO_Finanzas', 'DATOS_CONSOLIDADOS_2026.json')

def load_db():
    if os.path.exists(DB_PATH):
        with open(DB_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def clean_amount(val):
    if pd.isna(val): return 0
    val = str(val).replace('$', '').replace('.', '').replace(',', '').strip()
    try:
        return int(val)
    except:
        return 0

def robust_read_csv(f):
    # Strategy 1: Standard read
    try:
        df = pd.read_csv(f, sep=',', quotechar='"', engine='python')
        if len(df.columns) > 1: return df
    except: pass

    # Strategy 2: Manual cleanup of "double double quotes"
    try:
        with open(f, 'r', encoding='utf-8', errors='ignore') as file:
            content = file.read()
            # Replace "" with " and then handle the outer quotes
            content = content.replace('""', '"')
            # If the whole line is wrapped in " , remove them
            lines = content.splitlines()
            cleaned_lines = []
            for l in lines:
                if l.startswith('"') and l.endswith('"'):
                    cleaned_lines.append(l[1:-1])
                else:
                    cleaned_lines.append(l)
            
            new_content = "\n".join(cleaned_lines)
            return pd.read_csv(io.StringIO(new_content), sep=',', quotechar='"', engine='python')
    except Exception as e:
        print(f"Error en robust_read para {f}: {e}")
        return pd.DataFrame()

def process_boxmagic(files):
    results = {}
    for f in files:
        try:
            month = ""
            if "enero" in f.lower(): month = "enero"
            elif "febrero" in f.lower(): month = "febrero"
            elif "marzo" in f.lower(): month = "marzo"
            elif "abril" in f.lower(): month = "abril"
            
            if not month: continue
            
            df = robust_read_csv(f)
            if df.empty: continue
            
            # Find the "Monto" column
            monto_col = [c for c in df.columns if 'Monto' in str(c)]
            if monto_col:
                col = monto_col[0]
                total = df[col].apply(clean_amount).sum()
                if month not in results: results[month] = 0
                results[month] += total
                print(f"Subtotal {month} en {os.path.basename(f)}: ${total:,}")
            else:
                print(f"No se encontró columna Monto en {os.path.basename(f)}. Columnas detectadas: {df.columns.tolist()[:3]}...")
        except Exception as e:
            print(f"Error procesando {f}: {e}")
    return results

def run_etl():
    db = load_db()
    if not db or "entidades" not in db:
        print("No hay archivos indexados.")
        return

    print("--- INICIANDO EXTRACCIÓN DE DATOS ROBUSTA (ETL) ---")
    ventas_reales = process_boxmagic(db["entidades"]["boxmagic_files"])
    
    if "ingresos" not in db: db["ingresos"] = {"boxmagic": {}}
    
    for month, total in ventas_reales.items():
        if month not in db["ingresos"]["boxmagic"]:
            db["ingresos"]["boxmagic"][month] = {}
        db["ingresos"]["boxmagic"][month]["ventas_brutas_reales"] = int(total)

    with open(DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(db, f, indent=2, ensure_ascii=False)
    
    print("\nETL completado con éxito.")

if __name__ == "__main__":
    run_etl()
