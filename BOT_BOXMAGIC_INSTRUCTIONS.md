# 📑 PROTOCOLO DE DESCARGA: BOXMAGIC (REFERENCIA MAESTRA)

Este documento es el **Respaldo de Navegación** para el Bot de BoxMagic y el operador humano. Consolida las secuencias visuales y lógicas de ambas sedes.

---

## 🔐 1. ACCESO (LOGIN)
*   **URL:** `https://auth.boxmagic.cl/login/`
*   **Identificador:** `BOXMAGIC_EMAIL` (contactoboosbox@gmail.com)
*   **Clave:** `BOXMAGIC_PASSWORD` (#Campa2024)

---

## 🌐 2. IDENTIFICACIÓN DE SEDE (TOP LEFT)
La sede activa se reconoce por el texto en la parte superior izquierda de la pantalla:
*   **"The boos box"** → Sede Marina
*   **"The boos box campanario"** → Sede Campanario

---

## 🔄 3. SECUENCIA DE DESCARGA (FLUJO VISUAL)

Para descargar el reporte mensual de ventas, se debe seguir esta secuencia exacta (confirmada en fotos):

1.  **MÓDULO DE REPORTES (Circulo Amarillo):**
    *   Ir al sidebar de la izquierda.
    *   Hacer clic en el menú **"Reportes"**.

2.  **FILTRO DE FECHAS (Circulo Verde):**
    *   En la parte superior derecha de la tabla, hacer clic en el selector de fechas.
    *   Asegurar que el periodo sea el deseado (ej: **01/04/2026 - 30/04/2026**).
    *   Hacer clic en **"Filtrar"**.

3.  **DESCARGA DE DATOS (Circulo Rosado):**
    *   Sobre la tabla de resultados, ubicar el botón **"CSV"**.
    *   Hacer clic para iniciar la descarga del archivo.

---

## 🤖 4. CAMBIO DE SEDE (BACKEND LOGIC)
Si el bot necesita cambiar de sede, debe navegar a:
*   **URL de Cambio:** `https://boxmagic.cl/home/out_box`
*   **IDs de Centros:**
    *   **MARINA:** `VWQDqk1489` (ID 1077)
    *   **CAMPANARIO:** `R7XLbnaLV5` (ID 1385)

---

## 📂 5. RUTA DE ALMACENAMIENTO
Los archivos descargados deben guardarse o buscarse en:
*   `c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos\boxmagic\`

---
*Este archivo sirve como memoria persistente para el agente Antigravity sobre la navegación en BoxMagic.*
