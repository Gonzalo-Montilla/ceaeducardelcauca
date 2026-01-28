"""
Agregar columna caja_id a tabla pagos
"""
import psycopg2
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

def run_migration():
    """Ejecutar migración para agregar caja_id a pagos"""
    
    # Obtener DATABASE_URL de las variables de entorno o usar valor por defecto
    database_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/cea_educar")
    print(f"Conectando a: {database_url}")
    
    # Conectar a la base de datos
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    try:
        print("Verificando si la columna caja_id existe...")
        
        # Verificar si la columna ya existe
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='pagos' AND column_name='caja_id';
        """)
        
        exists = cur.fetchone()
        
        if exists:
            print("✓ La columna caja_id ya existe en la tabla pagos")
        else:
            print("Agregando columna caja_id a la tabla pagos...")
            
            # Agregar la columna caja_id
            cur.execute("""
                ALTER TABLE pagos 
                ADD COLUMN caja_id INTEGER;
            """)
            
            # Agregar la foreign key constraint
            cur.execute("""
                ALTER TABLE pagos 
                ADD CONSTRAINT fk_pagos_caja 
                FOREIGN KEY (caja_id) REFERENCES cajas(id) ON DELETE SET NULL;
            """)
            
            conn.commit()
            print("✓ Columna caja_id agregada exitosamente")
            print("✓ Foreign key constraint agregada")
        
    except Exception as e:
        conn.rollback()
        print(f"✗ Error: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    run_migration()
    print("\n¡Migración completada!")
