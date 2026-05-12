import pandas as pd
import os
import psycopg2
from psycopg2.extras import execute_values

# Configuración de BD
DB_URL = "postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway"

def procesar_asistencia():
    base_path = r"C:\PROYECTO DEV\AG TBB\data\ingesta_asistencia\2026\campanario"
    archivos = [f for f in os.listdir(base_path) if f.endswith('.xls')]
    
    conn = psycopg2.connect(DB_URL, sslmode='require')
    cur = conn.cursor()
    
    # Limpiar tabla temporal o previa si es necesario (Opcional, mejor acumular)
    # cur.execute("DELETE FROM asistencia_packs") 

    for archivo in archivos:
        full_path = os.path.join(base_path, archivo)
        print(f"--- Procesando: {archivo} ---")
        
        try:
            # Leer la hoja 'Detalles'
            df = pd.read_excel(full_path, sheet_name='Detalles')
            
            # Limpiar datos
            df = df.dropna(subset=['nombre', 'clase', 'fecha', 'hora'])
            
            records = []
            for _, row in df.iterrows():
                nombre_completo = f"{row['nombre']} {row['apellido']}".strip()
                records.append((
                    nombre_completo,
                    row['correo'],
                    row['clase'],
                    str(row['fecha']),
                    str(row['hora']),
                    'Campanario'
                ))
            
            # Insertar en BD (Columnas: alumno_nombre, correo, clase, fecha, hora, sede)
            query = "INSERT INTO asistencia_packs (alumno_nombre, correo, clase, fecha, hora, sede) VALUES %s"
            execute_values(cur, query, records)
            print(f"OK: {len(records)} registros insertados.")
            
        except Exception as e:
            print(f"Error en {archivo}: {str(e)}")
            
    conn.commit()
    cur.close()
    conn.close()
    print("\n🚀 Ingesta de 2026 completada exitosamente.")

if __name__ == "__main__":
    procesar_asistencia()
