import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.core.config import settings
import psycopg2

def main():
    print("🔍 Verificando datos en tabla instructores...")
    
    conn = psycopg2.connect(settings.DATABASE_URL)
    cur = conn.cursor()
    
    try:
        # Contar registros
        cur.execute("SELECT COUNT(*) FROM instructores")
        count = cur.fetchone()[0]
        print(f"📊 Total de instructores en BD: {count}")
        
        if count > 0:
            # Mostrar instructores existentes
            cur.execute("""
                SELECT id, usuario_id, licencia_numero, estado, 
                       licencia_vigencia_hasta, estado_documentacion
                FROM instructores
                ORDER BY id
            """)
            
            print("\n📋 Instructores existentes:")
            for row in cur.fetchall():
                print(f"  ID: {row[0]}, Usuario: {row[1]}, Lic: {row[2]}, Estado: {row[3]}, Vigencia: {row[4]}, Docs: {row[5]}")
            
            # Opción para limpiar
            print("\n⚠️  Hay instructores existentes. ¿Deseas limpiar la tabla? (puede causar problemas con el modelo viejo)")
        else:
            print("✅ Tabla instructores está vacía - lista para usar")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()
