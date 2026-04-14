from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres:oxmKtfyHzooYdsoFZZMBbmgtIEBKinmX@centerbeam.proxy.rlwy.net:48344/railway')

def limpiar_libro_compras():
    with engine.connect() as conn:
        print("Buscando registros para eliminar en FacturaCompra...")
        # Eliminamos boletas exentas o registros con datos incompletos del libro de compras
        # Las boletas exentas no deben estar en el Libro de Compras (Gastos) sino en Ventas Oficiales.
        # Las notas de crédito también las eliminamos de esta vista a petición del usuario.
        query = text("""
            DELETE FROM "FacturaCompra" 
            WHERE proveedor = 'SIN NOMBRE' 
               OR rut = 'nan' 
               OR iva = 0 
               OR proveedor LIKE '%BOLETA%';
        """)
        res = conn.execute(query)
        conn.commit()
        print(f"Limpieza exitosa. Se eliminaron {res.rowcount} registros de ruido.")

if __name__ == "__main__":
    limpiar_libro_compras()
