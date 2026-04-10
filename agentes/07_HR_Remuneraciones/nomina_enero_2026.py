
import pandas as pd

def generate_payroll_january():
    # Master data
    coaches = {
        'joaquin': {'rate': 10000, 'name': 'Joaquin Ortubia'},
        'nicolas': {'rate': 9000, 'name': 'Nicolas Millan'},
        'geraldine': {'rate': 7000, 'name': 'Geraldine Lastra'},
        'rodrigo': {'rate': 7000, 'name': 'Rodrigo Aguilera'},
        'daphne': {'rate': 7000, 'name': 'Daphne Urriola'},
        'cristian': {'rate': 7000, 'name': 'Cristian (Pendiente Rate)'},
        'javiera': {'rate': 7000, 'name': 'Javiera (Pendiente Rate)'}
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
    
    # Enrich with master data
    df['Nombre_Completo'] = df['coach'].apply(lambda x: coaches[x]['name'])
    df['Valor_Hora'] = df['coach'].apply(lambda x: coaches[x]['rate'])
    
    # Calculations (Chile Law 2026: 13.75% retention)
    retention_rate = 0.1375
    df['Bruto'] = df['horas'] * df['Valor_Hora']
    df['Neto_Pagar'] = (df['Bruto'] * (1 - retention_rate)).round(0).astype(int)
    df['Impuesto'] = (df['Bruto'] * retention_rate).round(0).astype(int)

    # Summaries
    print("\n" + "="*70)
    print("NÓMINA CONSOLIDADA ENERO 2026 - THE BOOS BOX")
    print("="*70)
    
    # 1. By Coach (Total consolidated)
    coach_summary = df.groupby('Nombre_Completo').agg({
        'horas': 'sum',
        'Bruto': 'sum',
        'Neto_Pagar': 'sum',
        'Impuesto': 'sum'
    }).sort_values('Neto_Pagar', ascending=False)
    
    print("\n--- RESUMEN DE PAGO POR COACH (PARA TRANSFERENCIA) ---")
    print(coach_summary)

    # 2. By Sede (Impact on Cost Center)
    sede_summary = df.groupby('sede').agg({'Bruto': 'sum'}).sort_values('Bruto', ascending=False)
    print("\n--- IMPACTO POR SEDE (COSTO BRUTO) ---")
    print(sede_summary)

    print("\n" + "="*70)
    print(f"TOTAL BRUTO ENERO: ${df['Bruto'].sum():,}")
    print(f"TOTAL LÍQUIDO A TRANSFERIR: ${df['Neto_Pagar'].sum():,}")
    print(f"IMPUESTO PENDIENTE DE PAGO (SII): ${df['Impuesto'].sum():,}")

if __name__ == "__main__":
    generate_payroll_january()
