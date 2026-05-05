# 🏛️ PROTOCOLO DE COORDINACIÓN DE AGENTES - AG TBB

**Fecha de Respaldo:** 2026-05-05
**Objetivo:** Garantizar la continuidad operativa del multisistema y la respuesta coordinada ante incidentes.

## 1. MAPPING DE RESPONSABILIDADES

| Agente | Dominio | Tipo de Respuesta |
| :--- | :--- | :--- |
| **Agente 01 (CTO)** | Infraestructura | Caídas de Railway, Errores Postgres, Despliegue. |
| **Agente 06 (Ing. Datos)** | ETL & Ingesta | Errores en CSVs de BoxMagic, Lioren o VirtualPost. |
| **Agente 07 (Publicidad)** | Estrategia & UI | Diseño de plantillas, Copys de campaña, Estética ERP. |
| **Agente 08 (Rescue)** | Retención | Orquestación de Win-back (Mail/WA), Tracking de Clics. |

## 2. FLUJO DE ESCALACIÓN
- **Nivel 1:** Detección automática (Logs). El agente responsable del script genera un aviso.
- **Nivel 2:** Intervención de Antigravity. Asumo el rol del agente afectado para aplicar el "Hotfix".
- **Nivel 3:** Reporte al Usuario. Se informa la resolución y se actualiza la `AGENTE_MEMORIA.md`.

## 3. CANALES DE DATOS (MULTISISTEMA)
- **Inputs:** BoxMagic (Alumnos), VirtualPost (Tarjetas), Lioren (SII).
- **Control:** ERP TBB (Egresos/Rendiciones).
- **Salidas:** BOOS RESCUE (Email/WhatsApp).

---
*Este documento es una copia de seguridad del protocolo de gobernanza del sistema AG TBB.*
