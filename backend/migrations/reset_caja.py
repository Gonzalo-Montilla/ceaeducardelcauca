"""
Cerrar todas las cajas abiertas - Resetear sistema
"""
import psycopg2
import os
from dotenv import load_dotenv
from datetime import datetime

# Cargar variables de entorno
load_dotenv()

def reset_cajas():
    """Cerrar todas las cajas abiertas"""
    
    # Obtener DATABASE_URL
    database_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/cea_educar")
    print(f"Conectando a: {database_url}")
    
    # Conectar a la base de datos
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    try:
        # Contar cajas abiertas
        cur.execute("SELECT COUNT(*) FROM cajas WHERE estado = 'ABIERTA';")
        count = cur.fetchone()[0]
        
        if count == 0:
            print("✓ No hay cajas abiertas")
        else:
            print(f"Cerrando {count} caja(s) abierta(s)...")
            
            # Cerrar todas las cajas abiertas
            cur.execute("""
                UPDATE cajas 
                SET estado = 'CERRADA',
                    fecha_cierre = NOW()
                WHERE estado = 'ABIERTA';
            """)
            
            conn.commit()
            print(f"✓ {count} caja(s) cerrada(s) exitosamente")
        
    except Exception as e:
        conn.rollback()
        print(f"✗ Error: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    reset_cajas()
    print("\n¡Reset completado!")
