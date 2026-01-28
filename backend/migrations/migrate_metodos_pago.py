"""
Migrar métodos de pago antiguos a nuevos valores
- TRANSFERENCIA -> TRANSFERENCIA_BANCARIA
- TARJETA -> TARJETA_DEBITO (por defecto)
"""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    """Migrar métodos de pago en tablas pagos y movimientos_caja"""
    
    database_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/cea_educar")
    print(f"Conectando a: {database_url}\n")
    
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    try:
        print("1. Actualizando métodos de pago en tabla PAGOS...")
        
        # Ver cuántos registros tienen valores antiguos (casting a text para evitar error de enum)
        cur.execute("""
            SELECT metodo_pago::text, COUNT(*) 
            FROM pagos 
            WHERE metodo_pago::text IN ('TRANSFERENCIA', 'TARJETA')
            GROUP BY metodo_pago::text;
        """)
        
        resultados = cur.fetchall()
        if resultados:
            for metodo, count in resultados:
                print(f"   Encontrados {count} pagos con método '{metodo}'")
        else:
            print("   ✓ No hay pagos con métodos antiguos")
        
        # Actualizar TRANSFERENCIA -> TRANSFERENCIA_BANCARIA
        cur.execute("""
            UPDATE pagos 
            SET metodo_pago = 'TRANSFERENCIA_BANCARIA'
            WHERE metodo_pago::text = 'TRANSFERENCIA';
        """)
        rows_updated = cur.rowcount
        if rows_updated > 0:
            print(f"   ✓ {rows_updated} pagos actualizados: TRANSFERENCIA -> TRANSFERENCIA_BANCARIA")
        
        # Actualizar TARJETA -> TARJETA_DEBITO
        cur.execute("""
            UPDATE pagos 
            SET metodo_pago = 'TARJETA_DEBITO'
            WHERE metodo_pago::text = 'TARJETA';
        """)
        rows_updated = cur.rowcount
        if rows_updated > 0:
            print(f"   ✓ {rows_updated} pagos actualizados: TARJETA -> TARJETA_DEBITO")
        
        print("\n2. Actualizando métodos de pago en tabla MOVIMIENTOS_CAJA...")
        
        # Ver cuántos registros tienen valores antiguos (casting a text)
        cur.execute("""
            SELECT metodo_pago::text, COUNT(*) 
            FROM movimientos_caja 
            WHERE metodo_pago::text IN ('TRANSFERENCIA', 'TARJETA')
            GROUP BY metodo_pago::text;
        """)
        
        resultados = cur.fetchall()
        if resultados:
            for metodo, count in resultados:
                print(f"   Encontrados {count} movimientos con método '{metodo}'")
        else:
            print("   ✓ No hay movimientos con métodos antiguos")
        
        # Actualizar TRANSFERENCIA -> TRANSFERENCIA_BANCARIA
        cur.execute("""
            UPDATE movimientos_caja 
            SET metodo_pago = 'TRANSFERENCIA_BANCARIA'
            WHERE metodo_pago::text = 'TRANSFERENCIA';
        """)
        rows_updated = cur.rowcount
        if rows_updated > 0:
            print(f"   ✓ {rows_updated} movimientos actualizados: TRANSFERENCIA -> TRANSFERENCIA_BANCARIA")
        
        # Actualizar TARJETA -> TARJETA_DEBITO
        cur.execute("""
            UPDATE movimientos_caja 
            SET metodo_pago = 'TARJETA_DEBITO'
            WHERE metodo_pago::text = 'TARJETA';
        """)
        rows_updated = cur.rowcount
        if rows_updated > 0:
            print(f"   ✓ {rows_updated} movimientos actualizados: TARJETA -> TARJETA_DEBITO")
        
        conn.commit()
        print("\n✅ Migración completada exitosamente!")
        
        # Mostrar resumen de métodos actuales
        print("\n📊 Resumen de métodos de pago actuales:")
        cur.execute("""
            SELECT metodo_pago, COUNT(*) 
            FROM pagos 
            GROUP BY metodo_pago 
            ORDER BY COUNT(*) DESC;
        """)
        print("\n   PAGOS:")
        for metodo, count in cur.fetchall():
            print(f"   - {metodo}: {count}")
        
        cur.execute("""
            SELECT metodo_pago, COUNT(*) 
            FROM movimientos_caja 
            GROUP BY metodo_pago 
            ORDER BY COUNT(*) DESC;
        """)
        movs = cur.fetchall()
        if movs:
            print("\n   MOVIMIENTOS CAJA:")
            for metodo, count in movs:
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
