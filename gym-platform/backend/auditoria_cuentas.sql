INSERT INTO "CuentaContable" (id, nombre, tipo, "createdAt") VALUES (gen_random_uuid(), 'IVA por Pagar (Débito Fiscal)', 'Pasivo', NOW()) ON CONFLICT (nombre) DO UPDATE SET tipo = 'Pasivo';
INSERT INTO "CuentaContable" (id, nombre, tipo, "createdAt") VALUES (gen_random_uuid(), 'Retenciones Honorarios 13.75%', 'Pasivo', NOW()) ON CONFLICT (nombre) DO UPDATE SET tipo = 'Pasivo';
INSERT INTO "CuentaContable" (id, nombre, tipo, "createdAt") VALUES (gen_random_uuid(), 'Leyes Sociales (Previred)', 'Pasivo', NOW()) ON CONFLICT (nombre) DO UPDATE SET tipo = 'Pasivo';
INSERT INTO "CuentaContable" (id, nombre, tipo, "createdAt") VALUES (gen_random_uuid(), 'Préstamos Bancarios Largo Plazo', 'Pasivo', NOW()) ON CONFLICT (nombre) DO UPDATE SET tipo = 'Pasivo';
INSERT INTO "CuentaContable" (id, nombre, tipo, "createdAt") VALUES (gen_random_uuid(), 'Cuentas por Pagar Proveedores', 'Pasivo', NOW()) ON CONFLICT (nombre) DO UPDATE SET tipo = 'Pasivo';
INSERT INTO "CuentaContable" (id, nombre, tipo, "createdAt") VALUES (gen_random_uuid(), 'Ingresos por Membresías', 'Ingreso', NOW()) ON CONFLICT (nombre) DO UPDATE SET tipo = 'Ingreso';
INSERT INTO "CuentaContable" (id, nombre, tipo, "createdAt") VALUES (gen_random_uuid(), 'Ingresos por Venta Suplementos/Café', 'Ingreso', NOW()) ON CONFLICT (nombre) DO UPDATE SET tipo = 'Ingreso';
