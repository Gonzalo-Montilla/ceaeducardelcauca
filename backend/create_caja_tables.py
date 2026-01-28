"""
Migración: Crear tablas de Caja y MovimientoCaja
"""
from app.core.database import engine, Base
from app.models import Caja, MovimientoCaja, Pago

def migrate():
    print("Creando tablas de Caja...")
    
    # Crear todas las tablas
    Base.metadata.create_all(bind=engine)
    
    print("✅ Tablas de Caja creadas exitosamente")
    print("   - cajas")
    print("   - movimientos_caja")
    print("   - Actualizada: pagos (con caja_id)")

if __name__ == "__main__":
    migrate()
