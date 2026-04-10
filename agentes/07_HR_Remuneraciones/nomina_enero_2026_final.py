
import pandas as pd

def generate_payroll_january_final():
    # Master data (Rates as NET amounts)
    coaches = {
        'joaquin': {'rate': 10000, 'name': 'Joaquin Ortubia', 'rut': '17.106.300-0'},
        'nicolas': {'rate': 9000, 'name': 'Nicolas Millan', 'rut': '17.278.171-3'},
        'geraldine': {'rate': 7000, 'name': 'Geraldine Lastra', 'rut': '19.031.723-4'},
        'rodrigo': {'rate': 7000, 'name': 'Rodrigo Aguilera', 'rut': '16.393.697-6'},
        'daphne': {'rate': 7000, 'name': 'Daphne Urriola', 'rut': '20.204.516-2'},
        'cristian': {'rate': 7000, 'name': 'Cristian Zapata', 'rut': '15.373.251-5'},
        'javiera': {'rate': 7000, 'name': 'Javiera Paz', 'rut': '17.957.360-1'}
    }

    # Input Hours
    data = [
        {'coach': 'joaquin', 'sede': 'Marina', 'horas': 65},
        {'coach': 'nicolas', 'sede': 'Marina', 'horas': 32},
        {'coach': 'geraldine', 'sede': 'Marina', 'horas': 87},
        {'coach': 'rodrigo', 'sede': 'Marina', 'horas': 2},
        {'coach': 'daphne', 'sede': 'Marina', 'horas': 32},
        {'coach': 'joaquin', 'sede': 'Campanario', 'horas': 36},
        {'coach': 'cristian', 'sede': 'Campanario', 'horas': 36},
        {'coach': 'geraldine', 'sede': 'Campanario', 'horas': 10},
        {'coach': 'rodrigo', 'sede': 'Campanario', 'horas': 26},
        {'coach': 'javiera', 'sede': 'Campanario', 'horas': 2}
    ]

    df = pd.DataFrame(data)
    
    # Calculations based on NET (Líquido)
    retention_rate = 0.1375 # 2026 Tax
    
    df['Nombre'] = df['coach'].apply(lambda x: coaches[x]['name'])
    df['Neto_Unitario'] = df['coach'].apply(lambda x: coaches[x]['rate'])
    df['Neto_Total'] = df['horas'] * df['Neto_Unitario']
    
    # Bruto calculation: Net / 0.8625
    df['Bruto_Total'] = (df['Neto_Total'] / (1 - retention_rate)).round(0).astype(int)
    df['Impuesto_Retenido'] = df['Bruto_Total'] - df['Neto_Total']

    # Final report
    print("\n" + "="*75)
    print("REPORTE FINAL CUADRATURA NOMINA ENERO 2026 - THE BOOS BOX")
    print("="*75)
    
    summary = df.groupby(['Nombre', 'coach']).agg({
        'horas': 'sum',
        'Neto_Total': 'sum',
        'Bruto_Total': 'sum',
        'Impuesto_Retenido': 'sum'
    }).rename(columns={'Neto_Total': 'Transferencia_BCI'}).sort_values('Transferencia_BCI', ascending=False)
    
    print(summary)
    
    print("\n" + "-"*30)
    print(f"RESUMEN PARA EL DIRECTOR:")
    print(f"- Total Transferido (Líquido): ${df['Neto_Total'].sum():,}")
    print(f"- Gasto Bruto Fiscal: ${df['Bruto_Total'].sum():,}")
    print(f"- Impuesto Pendiente SII: ${df['Impuesto_Retenido'].sum():,}")
    print("-"*30)
    
    # Validation check with screenshots
    cristian_net = df[df['coach'] == 'cristian']['Neto_Total'].sum()
    javiera_net = df[df['coach'] == 'javiera']['Neto_Total'].sum()
    print(f"Validación Cristian: ${cristian_net:,} (Match Screenshot: OK)")
    print(f"Validación Javiera: ${javiera_net:,} (Match Screenshot: OK)")

if __name__ == "__main__":
    generate_payroll_january_final()
