"""
Actualizar ENUM metodopago en PostgreSQL
- Agregar nuevos valores
- Quitar valores antiguos (esto requiere recrear el enum)
"""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    """Actualizar ENUM metodopago"""
    
    database_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/cea_educar")
    print(f"Conectando a: {database_url}\n")
    
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    try:
        print("Actualizando ENUM metodopago...")
        print("Este proceso recreará el enum con los nuevos valores\n")
        
        # 1. Crear un nuevo ENUM temporal con todos los valores
        print("1. Creando enum temporal...")
        cur.execute("""
            CREATE TYPE metodopago_new AS ENUM (
                'EFECTIVO',
                'NEQUI',
                'DAVIPLATA',
                'TRANSFERENCIA_BANCARIA',
                'TARJETA_DEBITO',
                'TARJETA_CREDITO'
            );
        """)
        print("   ✓ Enum temporal creado")
        
        # 2. Actualizar columnas para usar el nuevo tipo (con conversión)
        print("\n2. Actualizando tabla pagos...")
        cur.execute("""
            ALTER TABLE pagos 
            ALTER COLUMN metodo_pago TYPE metodopago_new 
            USING (
                CASE metodo_pago::text
                    WHEN 'TRANSFERENCIA' THEN 'TRANSFERENCIA_BANCARIA'::metodopago_new
                    WHEN 'TARJETA' THEN 'TARJETA_DEBITO'::metodopago_new
                    ELSE metodo_pago::text::metodopago_new
                END
            );
        """)
        print("   ✓ Tabla pagos actualizada")
        
        print("\n3. Actualizando tabla movimientos_caja...")
        cur.execute("""
            ALTER TABLE movimientos_caja 
            ALTER COLUMN metodo_pago DROP DEFAULT;
        """)
        
        # Ahora cambiamos el tipo (la columna es STRING, no ENUM!)
        cur.execute("""
            UPDATE movimientos_caja 
            SET metodo_pago = 'TRANSFERENCIA_BANCARIA'
            WHERE metodo_pago = 'TRANSFERENCIA';
        """)
        
        cur.execute("""
            UPDATE movimientos_caja 
            SET metodo_pago = 'TARJETA_DEBITO'
            WHERE metodo_pago = 'TARJETA';
        """)
        print("   ✓ Tabla movimientos_caja actualizada")
        
        # 3. Eliminar el enum antiguo y renombrar el nuevo
        print("\n4. Reemplazando enum antiguo...")
        cur.execute("DROP TYPE metodopago;")
        cur.execute("ALTER TYPE metodopago_new RENAME TO metodopago;")
        print("   ✓ Enum actualizado")
        
        conn.commit()
        print("\n✅ Migración completada exitosamente!")
        
        # Verificar
        print("\n📊 Métodos de pago actuales en PAGOS:")
        cur.execute("""
            SELECT metodo_pago::text, COUNT(*) 
            FROM pagos 
            GROUP BY metodo_pago::text 
            ORDER BY COUNT(*) DESC;
        """)
        for metodo, count in cur.fetchall():
            print(f"   - {metodo}: {count}")
        
    except Exception as e:
        conn.rollback()
        print(f"\n✗ Error: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    run_migration()
