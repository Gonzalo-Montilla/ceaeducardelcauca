"""
Permitir metodo_pago NULL en tabla pagos (para pagos mixtos)
"""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    """Modificar columna metodo_pago para permitir NULL"""
    
    database_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/cea_educar")
    print(f"Conectando a: {database_url}\n")
    
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    try:
        print("Modificando columna metodo_pago para permitir NULL...")
        
        # Cambiar la columna para permitir NULL
        cur.execute("""
            ALTER TABLE pagos 
            ALTER COLUMN metodo_pago DROP NOT NULL;
        """)
        
        print("   ✓ Columna metodo_pago ahora permite NULL")
        
        conn.commit()
        print("\n✅ Migración completada exitosamente!")
        
        # Verificar el cambio
        print("\n📊 Verificando columna metodo_pago:")
        cur.execute("""
            SELECT 
                column_name, 
                data_type, 
                is_nullable
            FROM information_schema.columns 
            WHERE table_name='pagos' 
            AND column_name='metodo_pago';
        """)
        
        for column, dtype, nullable in cur.fetchall():
            print(f"   - {column}: {dtype}, nullable={nullable}")
        
    except Exception as e:
        conn.rollback()
        print(f"\n✗ Error: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    run_migration()
