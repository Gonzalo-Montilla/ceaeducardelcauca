import os
import sys
from pathlib import Path

# Add the backend directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.config import settings
import psycopg2

def main():
    print("🔧 Limpiando columnas obsoletas de instructores...")
    
    conn = psycopg2.connect(settings.DATABASE_URL)
    cur = conn.cursor()
    
    # Columnas obsoletas que ya no están en el modelo actual
    columnas_obsoletas = [
        'licencia_vencimiento',
        'certificado_ansv_numero',
        'certificado_ansv_vencimiento',
        'is_disponible',
        'horarios_disponibles',
        'rating_promedio',
        'total_evaluaciones',
        'especialidades',
        'datos_adicionales'
    ]
    
    try:
        # Obtener columnas actuales
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'instructores'
        """)
        
        columnas_existentes = {row[0] for row in cur.fetchall()}
        
        # Eliminar columnas obsoletas
        for columna in columnas_obsoletas:
            if columna in columnas_existentes:
                print(f"🗑️  Eliminando columna obsoleta '{columna}'...")
                cur.execute(f"""
                    ALTER TABLE instructores 
                    DROP COLUMN IF EXISTS {columna}
                """)
                conn.commit()
                print(f"✅ Columna '{columna}' eliminada")
        
        print("\n✅ Limpieza completada")
        
        # Mostrar columnas finales
        cur.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'instructores' 
            ORDER BY ordinal_position
        """)
        
        print("\n📋 Columnas finales en tabla instructores:")
        for row in cur.fetchall():
            nullable = "NULL" if row[2] == "YES" else "NOT NULL"
            print(f"  - {row[0]}: {row[1]} ({nullable})")
            
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()
