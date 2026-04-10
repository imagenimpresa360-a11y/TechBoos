CREATE TABLE IF NOT EXISTS public.bci_income_pool (
    id SERIAL PRIMARY KEY,
    fecha_banco DATE,
    monto INT,
    nombre_banco VARCHAR(255),
    nro_operacion VARCHAR(100) UNIQUE,
    estado_match VARCHAR(20) DEFAULT 'PENDIENTE', 
    ignorar_masivo BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.daily_reconciliation (
    id SERIAL PRIMARY KEY,
    fecha_analisis DATE DEFAULT CURRENT_DATE,
    boxmagic_id VARCHAR(100), -- Puede ser un ID de boxmagic o un cliente si no hay ID
    boxmagic_nombre VARCHAR(255),
    boxmagic_monto INT,
    bci_income_id INT REFERENCES bci_income_pool(id) ON DELETE CASCADE,
    nivel_match INT, 
    aprobado_por VARCHAR(50) DEFAULT 'SISTEMA'
);
