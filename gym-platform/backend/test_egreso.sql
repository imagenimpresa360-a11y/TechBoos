INSERT INTO "Egreso" (id, mes, detalle, monto, abonado, sede, status, cuenta, origen, "updatedAt") 
VALUES (gen_random_uuid(), 'enero', 'ARRIENDO SEDE CAMPANARIO', 1530000, 0, 'Campanario', 'Ingresado', 'Arriendos', 'Manual', NOW());
