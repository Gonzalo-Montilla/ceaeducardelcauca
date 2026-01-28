"""
Agregar columnas para créditos (CrediSmart y Sistecredito) a tabla cajas
Estos NO suman al efectivo de caja
"""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    """Agregar columnas de créditos a tabla cajas"""
    
    database_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/cea_educar")
    print(f"Conectando a: {database_url}\n")
    
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    try:
        print("Agregando columnas de créditos a tabla cajas...")
        
        # Verificar si las columnas ya existen
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='cajas' AND column_name='total_credismart';
        """)
        
        if not cur.fetchone():
            # Agregar columnas para créditos
            cur.execute("""
                ALTER TABLE cajas 
                ADD COLUMN total_credismart NUMERIC(12, 2) DEFAULT 0 NOT NULL,
                ADD COLUMN total_sistecredito NUMERIC(12, 2) DEFAULT 0 NOT NULL;
            """)
            print("   ✓ Columnas total_credismart y total_sistecredito agregadas")
        else:
            print("   ✓ Columnas de créditos ya existen")
        
        # Actualizar ENUM de metodopago para incluir créditos
        print("\nActualizando ENUM metodopago...")
        
        # Verificar si ya existen los valores
        cur.execute("""
            SELECT EXISTS (
                SELECT 1 FROM pg_type t 
                JOIN pg_enum e ON t.oid = e.enumtypid  
                WHERE t.typname = 'metodopago' 
                AND e.enumlabel = 'CREDISMART'
            );
        """)
        
        existe_credismart = cur.fetchone()[0]
        
        if not existe_credismart:
            print("   Agregando valores CREDISMART y SISTECREDITO al enum...")
            cur.execute("ALTER TYPE metodopago ADD VALUE IF NOT EXISTS 'CREDISMART';")
            cur.execute("ALTER TYPE metodopago ADD VALUE IF NOT EXISTS 'SISTECREDITO';")
            print("   ✓ Valores agregados al enum")
        else:
            print("   ✓ Valores de crédito ya existen en el enum")
        
        conn.commit()
        print("\n✅ Migración completada exitosamente!")
        
        # Mostrar estructura
        print("\n📊 Columnas de totales en tabla cajas:")
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name='cajas' 
            AND column_name LIKE 'total_%'
            ORDER BY column_name;
        """)
        for column, dtype in cur.fetchall():
            print(f"   - {column}: {dtype}")
        
    except Exception as e:
        conn.rollback()
        print(f"\n✗ Error: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    run_migration()
