# 🏛️ DOCUMENTO DE RESPALDO Y ARQUITECTURA (ERP v52.0)
**Fecha:** 8 de Abril de 2026
**Autor:** Antigravity (Ingeniero Senior)
**Proyecto:** The Boos Box SPA - Ecosistema Financiero

## 1. EL "PENSAMIENTO" Y LA ESTRATEGIA (Por qué llegamos hasta aquí)
Nuestra meta era dejar atrás las hojas de Excel desorganizadas y crear un **ERP Inteligente de Alto Nivel**. La regla de oro que aplicamos para la versión 52.0 fue **"Independencia Operativa"**: no podíamos mezclar módulos tributarios (Lioren) con cajas chicas (Egresos diarios).

Al separar los datos en la base de datos, garantizamos que el sistema jamás se corrompa, ni siquiera si el Coordinador o Luis cargan datos erróneos en una pestaña. Cada módulo es un "motor con blindaje propio".

## 2. ARQUITECTURA DE LA BASE DE DATOS (PostgreSQL 18)
El sistema ahora descansa sobre 4 pilares en Postgres (cero Prisma ORM para evitar inestabilidad):

1. **`Nomina`**: Rastrea horas de los coaches por Sede.
2. **`Egreso`**: La tabla maestra de contabilidad real (Egresos).
3. **`CuentaContable`**: Categorías de ingresos, pasivos y egresos.
4. **`FacturaCompra` (NUEVO)**: Diseñado exclusivamente para el SII (Rut, Folio, Monto Neto, IVA).

## 3. LOS 6 MOTORES DEL FRONTEND (`App.jsx`)
Hemos compilado toda la aplicación en 6 núcleos inseparables dentro del archivo `App.jsx`:

1. **Dashboard Maestro (4 Niveles):** 
   - La verdad absoluta financiera jerarquizada: Banco BCI -> BoxMagic -> VirtualPost -> Lioren.
2. **Egresos & Abonos:** 
   - Panel operativo para Luis. Con capacidad de registrar salidas por sede (Campanario/Marina) y hacer pagos parciales (abonos).
3. **Nómina Excel:** 
   - Una interfaz que imita la planilla de Excel original del Coordinador. Al darle al botón "Procesar", se convierte el sueldo y se "Dispara" una orden contable hacia la tabla Egresos.
4. **Libro Compras (Lioren):** 
   - El puente tributario. Aquí descansan las facturas (simulando Excel B2B). Cuando se autoriza el pago de una factura, viaja directo a Egresos dejando el rastro oficial de IVA y Folio.
5. **Conciliación Apps:** 
   - Nuestro "Detector de Fugas". Compara en tiempo real lo que BoxMagic dice que se vendió vs lo que VirtualPost ingresó por tarjeta. La diferencia ("Brecha de Fuga") parpadea en rojo.
6. **Plan de Cuentas:** 
   - Estructurador contable básico tipo "Libro Mayor".

## 4. INSTRUCCIONES DE DESPLIEGUE EN FRÍO
Si alguna vez el sistema se apaga o el servidor se reinicia, estos son los pasos para levantarlo:

1. **Levantar el Backend (Motor SQL):**
   - Abrir un terminal en `c:\Users\DELL\Desktop\TECHEMPRESA\gym-platform\backend`
   - Ejecutar: `node server.js`
2. **Levantar el Frontend (Interfaz Visual):**
   - Abrir un SEGUNDO terminal en `c:\Users\DELL\Desktop\TECHEMPRESA\gym-platform`
   - Ejecutar: `npm run dev`
   - Ir a `http://localhost:5173`

Este documento certifica que el conocimiento, las reglas lógicas y la estructura están aseguradas para cualquier modificación futura. Todo el sistema está entrelazado pero con puertas lógicas herméticas.

## 5. CAPA DE INGESTA AUTOMATIZADA (NUEVO - 8 ABRIL)
Una de las debilidades del sistema eran las recargas y las limitaciones de las APIs de terceros gubernamentales (como SII/Lioren). Para solventarlo, se implementó una **Flota de Bots Fantasma con Playwright** (`bot_lioren_scraper.py`).
1. **Acceso Hermético:** Todas las contraseñas se descentralizaron al cofre maestro `.env` de la raíz del sistema.
2. **Escaneo Óptico Asíncrono:** Se suprimió la dependencia al `networkidle` que causaba colapsos por WebSockets abiertos en tiempo real. Ahora el bot "observa" literalmente el HTML en busca de selectores exactos (`text=SELECCIONAR` o `text=Exportar`) en modos visuales y agnósticos al backend ajeno.
3. **Punto de Aterrizaje:** Todo Data Lake fluye instantáneamente a la carpeta segura `/tmp` donde el Backend de Postgres la consume y reparte al Frontend, completando el ciclo sin intervención manual ("Mapeo Turbo").
