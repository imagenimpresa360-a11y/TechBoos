CREATE TABLE IF NOT EXISTS public.boxmagic_sales (
    id SERIAL PRIMARY KEY,
    fecha_pago DATE,
    cliente VARCHAR(255),
    monto INT,
    tipo_pago VARCHAR(50), -- Efectivo, Transferencia, Webpay, etc.
    vendedor VARCHAR(150),
    sede VARCHAR(50),      -- Campanario, Marina
    mes VARCHAR(20),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Columna faltante en bci_income_pool si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bci_income_pool' AND column_name='updated_at') THEN
        ALTER TABLE bci_income_pool ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;
