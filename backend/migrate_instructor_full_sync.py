import os
import sys
from pathlib import Path

# Add the backend directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.config import settings
import psycopg2

def main():
    print("🔧 Sincronizando modelo Instructor con base de datos...")
    
    conn = psycopg2.connect(settings.DATABASE_URL)
    cur = conn.cursor()
    
    # Columnas que deben existir según el modelo
    columnas_requeridas = [
        ("foto_url", "TEXT"),
        ("especialidad", "VARCHAR(200)"),
        ("estado", "VARCHAR(50)"),  # EstadoInstructor enum
        ("fecha_contratacion", "DATE"),
        ("certificaciones", "TEXT"),
        ("tipo_contrato", "VARCHAR(50)"),
        ("calificacion_promedio", "NUMERIC(3, 2) DEFAULT 0.0"),
    ]
    
    try:
        # Obtener columnas actuales
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'instructores'
        """)
        
        columnas_existentes = {row[0] for row in cur.fetchall()}
        print(f"📋 Columnas existentes: {len(columnas_existentes)}")
        
        # Agregar columnas faltantes
        for nombre_columna, tipo_columna in columnas_requeridas:
            if nombre_columna not in columnas_existentes:
                print(f"➕ Agregando columna '{nombre_columna}'...")
                cur.execute(f"""
                    ALTER TABLE instructores 
                    ADD COLUMN {nombre_columna} {tipo_columna}
                """)
                conn.commit()
                print(f"✅ Columna '{nombre_columna}' agregada")
            else:
                print(f"✓ Columna '{nombre_columna}' ya existe")
        
        print("\n✅ Sincronización completada")
        
        # Mostrar todas las columnas finales
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'instructores' 
            ORDER BY ordinal_position
        """)
        
        print("\n📋 Columnas finales en tabla instructores:")
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
