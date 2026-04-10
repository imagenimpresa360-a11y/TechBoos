
import pandas as pd

def generate_payroll_february():
    # Master data (Rates as NET amounts)
    coaches = {
        'joaquin': {'rate': 10000, 'name': 'Joaquin Ortubia'},
        'nicolas': {'rate': 9000, 'name': 'Nicolas Millan'},
        'geraldine': {'rate': 7000, 'name': 'Geraldine Lastra'},
        'rodrigo': {'rate': 7000, 'name': 'Rodrigo Aguilera'},
        'daphne': {'rate': 7000, 'name': 'Daphne Urriola'},
        'cristian': {'rate': 7000, 'name': 'Cristian Zapata'},
        'gabriela': {'rate': 7000, 'name': 'Gabriela Sanchez'},
        'camilo': {'rate': 7000, 'name': 'Camilo Ulloa'}
    }

    # Input Hours FEBRERO
    data = [
        {'coach': 'joaquin', 'sede': 'Marina', 'horas': 60},
        {'coach': 'nicolas', 'sede': 'Marina', 'horas': 35},
        {'coach': 'geraldine', 'sede': 'Marina', 'horas': 59},
        {'coach': 'rodrigo', 'sede': 'Marina', 'horas': 4},
        {'coach': 'daphne', 'sede': 'Marina', 'horas': 48},
        {'coach': 'joaquin', 'sede': 'Campanario', 'horas': 32},
        {'coach': 'cristian', 'sede': 'Campanario', 'horas': 36},
        {'coach': 'geraldine', 'sede': 'Campanario', 'horas': 6},
        {'coach': 'gabriela', 'sede': 'Campanario', 'horas': 58},
        {'coach': 'rodrigo', 'sede': 'Campanario', 'horas': 8},
        {'coach': 'camilo', 'sede': 'Campanario', 'horas': 2}
    ]

    df = pd.DataFrame(data)
    
    # Calculations
    retention_rate = 0.1375 # 2026 Tax
    
    df['Nombre'] = df['coach'].apply(lambda x: coaches[x]['name'])
    df['Neto_Unitario'] = df['coach'].apply(lambda x: coaches[x]['rate'])
    df['Neto_Total'] = df['horas'] * df['Neto_Unitario']
    df['Bruto_Total'] = (df['Neto_Total'] / (1 - retention_rate)).round(0).astype(int)
    df['Impuesto_Retenido'] = df['Bruto_Total'] - df['Neto_Total']

    # Summaries
    print("\n" + "="*75)
    print("REPORTE DE REMUNERACIONES FEBRERO 2026 - THE BOOS BOX")
    print("="*75)
    
    summary = df.groupby('Nombre').agg({
        'horas': 'sum',
        'Neto_Total': 'sum',
        'Bruto_Total': 'sum',
        'Impuesto_Retenido': 'sum'
    }).rename(columns={'Neto_Total': 'Liquido_A_Transferir'}).sort_values('Liquido_A_Transferir', ascending=False)
    
    print(summary)
    
    print("\n--- IMPACTO POR SEDE (COSTO BRUTO) ---")
    print(df.groupby('sede').agg({'Bruto_Total': 'sum'}).sort_values('Bruto_Total', ascending=False))

    print("\n" + "="*70)
    print(f"TOTAL BRUTO FEBRERO: ${df['Bruto_Total'].sum():,}")
    print(f"TOTAL LÍQUIDO (TRANSFERENCIA): ${df['Neto_Total'].sum():,}")
    print(f"IMPUESTO SII FEBRERO: ${df['Impuesto_Retenido'].sum():,}")

if __name__ == "__main__":
    generate_payroll_february()
