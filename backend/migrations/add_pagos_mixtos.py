"""
Migración para agregar soporte de pagos mixtos
- Agregar columna es_pago_mixto a tabla pagos
- Crear tabla detalles_pago
"""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    """Ejecutar migración para pagos mixtos"""
    
    database_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/cea_educar")
    print(f"Conectando a: {database_url}\n")
    
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    try:
        print("1. Verificando y agregando columna es_pago_mixto a pagos...")
        
        # Verificar si la columna ya existe
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='pagos' AND column_name='es_pago_mixto';
        """)
        
        if not cur.fetchone():
            cur.execute("""
                ALTER TABLE pagos 
                ADD COLUMN es_pago_mixto INTEGER DEFAULT 0 NOT NULL;
            """)
            print("   ✓ Columna es_pago_mixto agregada")
        else:
            print("   ✓ Columna es_pago_mixto ya existe")
        
        print("\n2. Creando tabla detalles_pago...")
        
        # Verificar si la tabla ya existe
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name='detalles_pago';
        """)
        
        if not cur.fetchone():
            cur.execute("""
                CREATE TABLE detalles_pago (
                    id SERIAL PRIMARY KEY,
                    pago_id INTEGER NOT NULL REFERENCES pagos(id) ON DELETE CASCADE,
                    metodo_pago VARCHAR(50) NOT NULL,
                    monto NUMERIC(10, 2) NOT NULL,
                    referencia VARCHAR(100),
                    created_at TIMESTAMP NOT NULL DEFAULT NOW()
                );
            """)
            
            # Crear índices
            cur.execute("""
                CREATE INDEX idx_detalles_pago_pago_id ON detalles_pago(pago_id);
            """)
            
            print("   ✓ Tabla detalles_pago creada")
            print("   ✓ Índices creados")
        else:
            print("   ✓ Tabla detalles_pago ya existe")
        
        conn.commit()
        print("\n✅ Migración completada exitosamente!")
        
    except Exception as e:
        conn.rollback()
        print(f"\n✗ Error: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    run_migration()
