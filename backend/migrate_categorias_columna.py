import os
import sys
from pathlib import Path

# Add the backend directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.config import settings
import psycopg2

def main():
    print("🔧 Verificando y agregando columna categorias_enseña...")
    
    conn = psycopg2.connect(settings.DATABASE_URL)
    cur = conn.cursor()
    
    try:
        # Verificar si la columna existe
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'instructores' 
            AND column_name = 'categorias_enseña'
        """)
        
        if cur.fetchone():
            print("✅ La columna 'categorias_enseña' ya existe")
        else:
            print("➕ Agregando columna 'categorias_enseña'...")
            cur.execute("""
                ALTER TABLE instructores 
                ADD COLUMN "categorias_enseña" VARCHAR(100)
            """)
            conn.commit()
            print("✅ Columna 'categorias_enseña' agregada exitosamente")
        
        # Mostrar columnas actuales
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'instructores' 
            ORDER BY ordinal_position
        """)
        
        print("\n📋 Columnas actuales en tabla instructores:")
        for row in cur.fetchall():
            print(f"  - {row[0]}: {row[1]}")
            
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()
