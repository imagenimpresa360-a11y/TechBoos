from fpdf import FPDF
import json
import os

def create_report():
    # Load Source Data
    json_path = r'c:\Users\DELL\Desktop\TECHEMPRESA\agentes\02_CFO_Finanzas\DATOS_CONSOLIDADOS_2026.json'
    with open(json_path, 'r') as f:
        data = json.load(f)

    mantenimiento = data['egresos']['mantenimiento']
    
    pdf = FPDF()
    pdf.add_page()
    
    # 1. Official Header
    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 15, "INFORME DE PRESUPUESTO OPERATIVO", ln=True, align="C")
    
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(44, 62, 80)
    pdf.cell(0, 10, "PARA: THE BOOS BOX", ln=True, align="C")
    
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(127, 140, 141)
    pdf.cell(0, 5, "Departamento de Finanzas (CFO) | Fecha: 07-04-2026", ln=True, align="C")
    pdf.ln(10)

    # 2. Consolidated Summary
    total_general = 0
    for sede in mantenimiento:
        for item in mantenimiento[sede]:
            total_general += item['total']

    pdf.set_fill_color(52, 152, 219) # Blue
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 10, "   1. RESUMEN CONSOLIDADO DE INVERSION", ln=True, fill=True)
    
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Helvetica", "", 12)
    pdf.ln(2)
    pdf.cell(100, 10, "Inversion Total Estimada (Invierno 2026):")
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, f"${total_general:,}".replace(',', '.'), ln=True)
    pdf.ln(8)

    # 3. Detailed breakdown by branch
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 10, "   2. DESGLOSE DETALLADO POR SEDE", ln=True, fill=True)
    pdf.set_text_color(0, 0, 0)
    pdf.ln(5)

    for sede in mantenimiento:
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_fill_color(236, 240, 241) # Light Grey
        pdf.cell(0, 8, f"  SEDE: {sede.upper()}", ln=True, fill=True)
        pdf.ln(2)
        
        # Column Headers for table
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(10, 7, "", border=0) # Margin
        pdf.cell(100, 7, "ITEM / CONCEPTO", border="B")
        pdf.cell(40, 7, "MONTO", border="B", align="R")
        pdf.ln(8)

        pdf.set_font("Helvetica", "", 10)
        for item in mantenimiento[sede]:
            # Print each detail row
            for concepto, monto in item['detalle'].items():
                pdf.cell(10, 6, "", border=0) # Margin
                clean_concepto = concepto.replace('_', ' ').capitalize()
                pdf.cell(100, 6, f"- {clean_concepto}", border=0)
                pdf.cell(40, 6, f"${monto:,}".replace(',', '.'), border=0, align="R")
                pdf.ln(6)
            
            # Subtotal for the branch
            pdf.ln(2)
            pdf.set_font("Helvetica", "B", 10)
            pdf.cell(10, 7, "", border=0)
            pdf.cell(100, 7, f"SUBTOTAL {sede.upper()}", border="T")
            pdf.cell(40, 7, f"${item['total']:,}".replace(',', '.'), border="T", align="R")
            pdf.ln(12)

    # 4. Certification Footer
    pdf.set_y(-40)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(149, 165, 166)
    pdf.cell(0, 10, "Este documento tiene validez contable para provision de fondos.", ln=True, align="C")
    pdf.cell(0, 5, "Propiedad de THE BOOS BOX - Generado por Agente CFO", ln=True, align="C")

    output_path = r'c:\Users\DELL\Desktop\TECHEMPRESA\INFORME_PRESUPUESTO_INVIERNO.pdf'
    pdf.output(output_path)
    print(f"Professional Report generated: {output_path}")

if __name__ == "__main__":
    create_report()
