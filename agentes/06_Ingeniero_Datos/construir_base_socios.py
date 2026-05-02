#!/usr/bin/env python3
import os
import sys
import re
import psycopg2
import psycopg2.extras
from datetime import datetime, date
import xlrd
import csv
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOWNLOADS_DIR = os.path.join(BASE_DIR, "downloads_boxmagic")
CLIENTES_XLS  = os.path.join(DOWNLOADS_DIR, "Clientes.xls")
VENTAS_CSV_FALLBACK = os.path.join(DOWNLOADS_DIR, "BoxMagic (1).csv")
DB_URL = os.environ.get("DATABASE_URL")
if DB_URL and "rlwy.net" in DB_URL and "sslmode" not in DB_URL:
    DB_URL += "&sslmode=require" if "?" in DB_URL else "?sslmode=require"

HOY = date.today()

def limpiar_monto(texto):
    if not texto: return 0
    limpio = re.sub(r'[^\d]', '', str(texto))
    return int(limpio) if limpio else 0

def limpiar_telefono(texto):
    if not texto: return ""
    digits = re.sub(r'\D', '', str(texto))
    if len(digits) == 9 and digits.startswith('9'): return f"+56{digits}"
    elif len(digits) == 8: return f"+569{digits}"
    elif len(digits) >= 11 and digits.startswith('56'): return f"+{digits[:11]}"
    return digits

def parsear_fecha(texto):
    if not texto: return None
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try: return datetime.strptime(texto.strip(), fmt).date()
        except: continue
    return None

def dias_inactivo(ultima_fecha):
    if not ultima_fecha: return 9999
    return (HOY - ultima_fecha).days

def segmento_riesgo(dias):
    if dias < 30: return "Verde"
    elif dias < 60: return "Amarillo"
    elif dias < 180: return "Rojo"
    return "Critico"

DDL_SOCIOS = "CREATE TABLE IF NOT EXISTS socios (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), boxmagic_id VARCHAR(20), nombre VARCHAR(150) NOT NULL, email VARCHAR(200), telefono VARCHAR(25), instagram VARCHAR(100), sede_habitual VARCHAR(50), plan_ultimo VARCHAR(150), monto_promedio INTEGER DEFAULT 0, fecha_primer_pago DATE, fecha_ultimo_pago DATE, total_pagado INTEGER DEFAULT 0, dias_inactivo INTEGER DEFAULT 0, coach_referente VARCHAR(100), estado VARCHAR(20) DEFAULT 'Inactivo', segmento_riesgo VARCHAR(20) DEFAULT 'Verde', canal_contacto VARCHAR(30) DEFAULT 'WhatsApp', notas TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW(), UNIQUE(email));"
DDL_HISTORIAL = "CREATE TABLE IF NOT EXISTS historial_pagos (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), socio_id UUID REFERENCES socios(id) ON DELETE CASCADE, fecha DATE NOT NULL, monto INTEGER NOT NULL DEFAULT 0, plan VARCHAR(150), tipo_pago VARCHAR(50), sede VARCHAR(50), estado_membresia VARCHAR(30), origen VARCHAR(30) DEFAULT 'BoxMagic', created_at TIMESTAMP DEFAULT NOW());"
DDL_CAMPANAS = "CREATE TABLE IF NOT EXISTS campanas_recuperacion (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), socio_id UUID REFERENCES socios(id) ON DELETE CASCADE, tipo_contacto VARCHAR(50) DEFAULT 'WhatsApp', fecha_contacto TIMESTAMP DEFAULT NOW(), promo_ofrecida VARCHAR(200) DEFAULT '4 clases x $19.000 Pack Reactivacion', estado_gestion VARCHAR(30) DEFAULT 'Pendiente', respuesta TEXT, fecha_respuesta TIMESTAMP, resultado VARCHAR(50), monto_recuperado INTEGER DEFAULT 0, agente_nombre VARCHAR(100), created_at TIMESTAMP DEFAULT NOW());"

def leer_clientes_xls():
    print(f"\n[INFO] Leyendo {CLIENTES_XLS}...")
    socios = {}
    try:
        wb = xlrd.open_workbook(CLIENTES_XLS, encoding_override='utf-8')
        ws = wb.sheet_by_index(0)
        header_row = 0
        headers = [str(ws.cell_value(header_row, c)).strip().lower() for c in range(ws.ncols)]
        col_map = {}
        for i, h in enumerate(headers):
            if 'nombre' in h or 'name' in h: col_map.setdefault('nombre', i)
            if 'apellido' in h or 'last' in h: col_map.setdefault('apellido', i)
            if 'email' in h or 'correo' in h or 'mail' in h: col_map.setdefault('email', i)
            if 'tel' in h or 'fono' in h or 'phone' in h or 'celular' in h: col_map.setdefault('telefono', i)
        for row in range(header_row + 1, ws.nrows):
            try:
                nombre = str(ws.cell_value(row, col_map.get('nombre', 0))).strip()
                email = str(ws.cell_value(row, col_map.get('email', 2))).strip().lower()
                telefono = limpiar_telefono(str(ws.cell_value(row, col_map.get('telefono', 3))).strip())
                if email and '@' in email:
                    socios[email] = {'nombre': nombre, 'email': email, 'telefono': telefono}
            except: continue
        print(f"   [OK] {len(socios)} socios con email leidos de XLS")
    except Exception as e:
        print(f"   [ERROR] Error leyendo XLS: {e}")
    return socios

def leer_csv_ventas(path_csv, sede):
    transacciones = []
    print(f"\n[INFO] Leyendo {path_csv} [{sede}]...")
    try:
        with open(path_csv, 'r', encoding='utf-8-sig', errors='replace') as f:
            reader = csv.reader(f)
            headers = next(reader)
            # Detectar si es el formato de "Cartera" o de "Ventas"
            # Formato Ventas: [N, Cliente, Email, Estado, Plan, Fecha pago, ...]
            # Formato Cartera: [Cliente, Estado, Membresias, ...]
            is_cartera = "membresia" in "".join(headers).lower()
            
            for row in reader:
                try:
                    if is_cartera:
                        # Formato: "Nombre email", "Estado", ...
                        full_name_email = row[0]
                        email_match = re.search(r'[\w\.-]+@[\w\.-]+', full_name_email)
                        email = email_match.group(0).lower() if email_match else ""
                        nombre = full_name_email.replace(email, "").strip()
                        transacciones.append({
                            'nombre': nombre, 'email': email, 'estado': row[1],
                            'plan': row[2], 'monto': limpiar_monto(row[4]),
                            'fecha_pago': parsear_fecha(row[5].split(" - ")[0]),
                            'sede': sede
                        })
                    else:
                        # Formato Ventas oficial
                        transacciones.append({
                            'boxmagic_id': row[0], 'nombre': row[1], 'email': row[2].lower(),
                            'estado': row[3], 'plan': row[4], 'fecha_pago': parsear_fecha(row[5]),
                            'monto': limpiar_monto(row[8]), 'vendedor': row[9], 'sede': sede
                        })
                except: continue
        print(f"   [OK] {len(transacciones)} transacciones leidas")
    except Exception as e:
        print(f"   [ERROR] Error leyendo CSV: {e}")
    return transacciones

def poblar_base_datos(conn, contactos, transacciones):
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    fichas = {}
    for t in transacciones:
        email = t.get('email', '').strip()
        if not email or '@' not in email: continue
        if email not in fichas:
            fichas[email] = {
                'nombre': t.get('nombre', '').title(), 'email': email,
                'sede_habitual': t.get('sede', ''), 'plan_ultimo': t.get('plan', ''),
                'fecha_primer_pago': t.get('fecha_pago'), 'fecha_ultimo_pago': t.get('fecha_pago'),
                'total_pagado': t.get('monto', 0), 'transacciones': [t]
            }
        else:
            f = fichas[email]
            fecha = t.get('fecha_pago')
            if fecha:
                if not f['fecha_primer_pago'] or fecha < f['fecha_primer_pago']: f['fecha_primer_pago'] = fecha
                if not f['fecha_ultimo_pago'] or fecha > f['fecha_ultimo_pago']:
                    f['fecha_ultimo_pago'] = fecha
                    f['plan_ultimo'] = t.get('plan', f['plan_ultimo'])
            f['total_pagado'] += t.get('monto', 0)
            f['transacciones'].append(t)
    
    print(f"\n[INFO] {len(fichas)} socios identificados")
    for email, f in fichas.items():
        if email in contactos: f['telefono'] = contactos[email].get('telefono', '')
        dias = dias_inactivo(f.get('fecha_ultimo_pago'))
        try:
            cur.execute("INSERT INTO socios (nombre, email, telefono, sede_habitual, plan_ultimo, fecha_primer_pago, fecha_ultimo_pago, total_pagado, dias_inactivo, estado, segmento_riesgo) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT (email) DO UPDATE SET fecha_ultimo_pago = EXCLUDED.fecha_ultimo_pago, plan_ultimo = EXCLUDED.plan_ultimo, total_pagado = EXCLUDED.total_pagado, dias_inactivo = EXCLUDED.dias_inactivo, segmento_riesgo = EXCLUDED.segmento_riesgo, telefono = COALESCE(EXCLUDED.telefono, socios.telefono), updated_at = NOW()", (f['nombre'], email, f.get('telefono', ''), f['sede_habitual'], f['plan_ultimo'], f['fecha_primer_pago'], f['fecha_ultimo_pago'], f['total_pagado'], dias, 'Activo' if dias < 30 else 'Inactivo', segmento_riesgo(dias)))
        except: continue
    conn.commit()
    print("[OK] Base de datos actualizada")

def main():
    print("="*60 + "\n AGENTE 06 - INGESTA DE SOCIOS\n" + "="*60)
    try:
        conn = psycopg2.connect(DB_URL)
        print("[OK] Conectado a DB")
        cur = conn.cursor()
        cur.execute(DDL_SOCIOS); cur.execute(DDL_HISTORIAL); cur.execute(DDL_CAMPANAS)
        conn.commit()
        contactos = leer_clientes_xls()
        todas = []
        if os.path.exists(VENTAS_CSV_FALLBACK): todas += leer_csv_ventas(VENTAS_CSV_FALLBACK, "Campanario")
        for s_fol, s_nom in [("campanario", "Campanario"), ("marina", "Marina")]:
            folder = os.path.join(BASE_DIR, "boxmagic", s_fol)
            if os.path.exists(folder):
                for f in os.listdir(folder):
                    if f.endswith('.csv'): todas += leer_csv_ventas(os.path.join(folder, f), s_nom)
        if todas:
            poblar_base_datos(conn, contactos, todas)
        else:
            print("[AVISO] No hay transacciones")
        conn.close()
    except Exception as e:
        print(f"[ERROR] {e}")
    print("\n[OK] Fin del proceso")

if __name__ == "__main__":
    main()
