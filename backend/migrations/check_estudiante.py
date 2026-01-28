"""
Verificar estado del estudiante en la BD
"""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def check_estudiante(cedula: str):
    """Verificar estado de un estudiante por cédula"""
    
    database_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/cea_educar")
    print(f"Conectando a: {database_url}\n")
    
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    try:
        # Buscar usuario
        cur.execute("""
            SELECT u.id, u.nombre_completo, u.cedula, u.email
            FROM usuarios u
            WHERE u.cedula = %s;
        """, (cedula,))
        
        usuario = cur.fetchone()
        if not usuario:
            print(f"❌ No se encontró usuario con cédula {cedula}")
            return
        
        print(f"✓ Usuario encontrado:")
        print(f"  ID: {usuario[0]}")
        print(f"  Nombre: {usuario[1]}")
        print(f"  Cédula: {usuario[2]}")
        print(f"  Email: {usuario[3]}\n")
        
        # Buscar estudiante
        cur.execute("""
            SELECT id, matricula_numero, estado, categoria, tipo_servicio, 
                   origen_cliente, valor_total_curso, saldo_pendiente
            FROM estudiantes
            WHERE usuario_id = %s;
        """, (usuario[0],))
        
        estudiante = cur.fetchone()
        if not estudiante:
            print(f"❌ No se encontró registro de estudiante")
            return
        
        print(f"✓ Estudiante encontrado:")
        print(f"  ID: {estudiante[0]}")
        print(f"  Matrícula: {estudiante[1]}")
        print(f"  Estado: {estudiante[2]}")
        print(f"  Categoría: {estudiante[3]}")
        print(f"  Tipo Servicio: {estudiante[4]}")
        print(f"  Origen Cliente: {estudiante[5]}")
        print(f"  Valor Total: ${estudiante[6]}")
        print(f"  Saldo Pendiente: ${estudiante[7]}\n")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Uso: python check_estudiante.py <cedula>")
        sys.exit(1)
    
    cedula = sys.argv[1]
    check_estudiante(cedula)
