# 🧠 MEMORIA DEL AGENTE — THE BOOS BOX ERP
**Última actualización:** 2026-04-29 18:35 (Sesión de Recuperación de Alumnos)

---

## 🎯 MISIÓN ACTUAL: Módulo de Recuperación de Socios (MRS)

El agente `06_Ingeniero_Datos` ha sido ampliado con una nueva misión:
**Departamento de Recuperación de Socios (DRS)**. El objetivo es convertir alumnos inactivos (>30 días sin pago) en ingresos recuperados mediante un panel integrado en el ERP.

---

## ✅ TRABAJO COMPLETADO HOY (29 de Abril 2026)

### 1. Diagnóstico de Datos
- **Confirmado:** BoxMagic contiene teléfonos en el reporte de Clientes (Formato: `9 XXXX XXXX`)
- **Confirmado:** El reporte de Ventas (CSV) contiene: Nombre, Email, Estado, Plan, Fecha pago, Tipo, Monto, Vendedor
- **Archivos descargados y guardados en:** `agentes/06_Ingeniero_Datos/downloads_boxmagic/`
  - `Clientes.xls` — Master de socios con RUT, Email, Teléfono (352KB)
  - `BoxMagic (1).csv` — Historial de membresías con estados (105KB, 439 registros)
  - `Alumnos Inactivos.xls` — Lista pre-filtrada de BoxMagic de inactivos (11KB)

### 2. Análisis Estratégico Completado
- **Definición de inactivo:** >30 días sin pago (criterio del propietario)
- **Canal primario de recuperación:** WhatsApp (botón directo desde el panel)
- **Promo de reingreso definida:** Pack de 4 clases x $19.000
  - Técnica de mejora propuesta: Upselling inmediato (los $19.000 se abonan al plan mensual si decide continuar)
- **Decisión arquitectónica:** Opción B — Panel integrado en ERP (no Excel)
- **Justificación:** Escalabilidad, datos frescos, historial de gestión centralizado, ROI medible

### 3. Estructura de Base de Datos Diseñada
Tres nuevas tablas para Railway PostgreSQL:
- `socios` — Ficha maestra de cada socio (email, teléfono, instagram, sede, estado)
- `historial_pagos` — Transacciones por socio (cruzado desde BoxMagic CSVs)
- `campanas_recuperacion` — Registro de cada contacto de recuperación y su resultado

---

## 🔄 EN PROGRESO (Esta sesión)

### Scripts del Agente 06 (en construcción):
- `construir_base_socios.py` — Ingesta de Clientes.xls + CSVs → tabla `socios`
- `clasificar_inactivos.py` — Calcula días de inactividad y asigna segmento de riesgo
- Panel ERP "Recuperación" — Vista web integrada con bandeja de trabajo

### Endpoints API backend (en construcción):
- `GET /api/socios/inactivos` — Lista depurada y priorizada
- `PUT /api/socios/:id/estado` — Actualizar estado de gestión
- `POST /api/campanas` — Registrar contacto realizado

---

## 📋 PENDIENTE (Próximas sesiones)

- [ ] Poblar tabla `socios` con datos reales de Clientes.xls (Campanario)
- [ ] Poblar tabla `socios` con datos de sede Marina
- [ ] Conectar Instagram handles (Técnica B: Match fuzzy con lista de seguidores)
- [ ] Configurar envío de email automático (SendGrid / Mailchimp)
- [ ] Migración completa a Railway (base de datos de producción)
- [ ] Reporte mensual de ROI por campaña de recuperación

---

## 🔐 CREDENCIALES CONOCIDAS (Sistema)

- **BoxMagic Login:** `contactoboosbox@gmail.com` / `#Campa2024`
- **Centro Campanario ID:** `R7XLbnaLV5`
- **DB Railway:** Ver `.env` en raíz del proyecto

---

## 💰 ROI PROYECTADO (Validado con datos reales)

Con 439 registros analizados del CSV de membresías (solo Campanario):
- Alumnos con "Membresia Inactiva": ~230 registros únicos
- Alumnos recuperables (últimos 6 meses): ~80-100 personas
- Con tasa de conversión del 20% y ticket promedio $39.000:
  - **Ingreso recuperable estimado: $624.000 - $780.000 / mes**

---

## 🏗️ ARQUITECTURA DEL MÓDULO DRS

```
[BoxMagic CSV Export] ──→ [construir_base_socios.py] ──→ [DB: tabla socios]
[Clientes.xls]        ──→                            ──→ [DB: historial_pagos]
                                                           ↓
[clasificar_inactivos.py] ←── [Cron diario 07:00 AM] ────┘
         ↓ actualiza segmento_riesgo y fecha_ultimo_pago
         ↓
[Panel ERP /recuperacion] ──→ [Ejecutivo de Retención]
         ↓                            ↓
[GET /api/socios/inactivos]   [Click: Botón WhatsApp]
[ordenados por prioridad]     [Marca estado: Contactado/Cerrado]
         ↓
[DB: campanas_recuperacion] ──→ [Dashboard ROI mensual]
```

---

## 📁 ARCHIVOS CLAVE DEL PROYECTO

| Archivo | Ubicación | Estado |
|---|---|---|
| `AGENTE_MEMORIA.md` | Raíz | ✅ Actualizado hoy |
| `construir_base_socios.py` | `agentes/06_Ingeniero_Datos/` | 🔄 En construcción |
| `clasificar_inactivos.py` | `agentes/06_Ingeniero_Datos/` | 📋 Pendiente |
| `server.js` | `gym-platform/backend/` | ✅ Base existente |
| `App.jsx` | `gym-platform/src/` | 🔄 Agregar módulo MRS |
| `Clientes.xls` | `agentes/06_Ingeniero_Datos/downloads_boxmagic/` | ✅ Descargado hoy |
| `BoxMagic (1).csv` | `agentes/06_Ingeniero_Datos/downloads_boxmagic/` | ✅ Descargado hoy |

---

*Documento autogenerado por el Agente 06 — Ingeniero de Datos / Departamento de Recuperación de Socios*
