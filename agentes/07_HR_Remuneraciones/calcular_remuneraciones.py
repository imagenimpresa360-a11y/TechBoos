
import pandas as pd
import os

def process_payroll(csv_path):
    if not os.path.exists(csv_path):
        print(f"File {csv_path} not found.")
        return

    df = pd.read_csv(csv_path)
    
    # Calculate daily totals if missing (re-validation)
    df['Total_Dia'] = df['Horas'] * df['Valor_Hora']
    
    # 1. Total per Coach
    print("\n--- RESUMEN DE PAGO POR COACH ---")
    payroll_coach = df.groupby('Coach').agg({'Horas': 'sum', 'Total_Dia': 'sum'}).rename(columns={'Total_Dia': 'Monto_Final'})
    print(payroll_coach)

    # 2. Total per Sede (Cost Centers)
    print("\n--- RESUMEN DE COSTO POR SEDE ---")
    payroll_sede = df.groupby('Sede').agg({'Total_Dia': 'sum'}).sort_values('Total_Dia', ascending=False)
    print(payroll_sede)

    # 3. Monthly total
    print(f"\nTOTAL ACUMULADO REMUNERACIONES: ${df['Total_Dia'].sum():,}")

if __name__ == "__main__":
    csv_file = r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\07_HR_Remuneraciones\asistencia_coach_abril_2026.csv'
    process_payroll(csv_file)
