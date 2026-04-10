import pandas as pd

FILE = r'c:/Users/DELL/Desktop/TECHEMPRESA/agentes/02_CFO_Finanzas/BANCO BCI/CARTOLAS MOVIMIENTOS MES/2026-04-07_Movimientos_Detallado_Cuenta_9086_THE BOOS BOOX SPA.xlsx'

df = pd.read_excel(FILE)
df['Fecha de transacción'] = pd.to_datetime(df['Fecha de transacción'], errors='coerce')
df['Egreso (-)'] = pd.to_numeric(df['Egreso (-)'], errors='coerce').fillna(0)
df['Ingreso (+)'] = pd.to_numeric(df['Ingreso (+)'], errors='coerce').fillna(0)

df_april = df[df['Fecha de transacción'].dt.month == 4].copy()
egresos = df_april[df_april['Egreso (-)'] > 0].copy()
ingresos = df_april[df_april['Ingreso (+)'] > 0].copy()

print("=== EGRESOS ABRIL 2026 ===")
for _, r in egresos.iterrows():
    fecha = str(r['Fecha de transacción'])[:10]
    glosa = str(r['Glosa detalle'])[:55]
    monto = r['Egreso (-)']
    print(f"{fecha} | {glosa:<55} | ${monto:>12,.0f}")

print("\n=== RESUMEN ===")
print(f"Total Egresos Abril:  ${egresos['Egreso (-)'].sum():>12,.0f}")
print(f"Total Ingresos Abril: ${ingresos['Ingreso (+)'].sum():>12,.0f}")
