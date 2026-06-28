"""
Agregar nuevas categorías de egreso al enum de PostgreSQL:
- DERECHOS_TRANSITO
- EXAMENES_MEDICOS
"""
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()


def run_migration():
    database_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/cea_educar")
    print(f"Conectando a: {database_url}\n")

    conn = psycopg2.connect(database_url)
    cur = conn.cursor()

    try:
        cur.execute(
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM pg_type
                    WHERE typname = 'conceptomovimientocaja'
                ) THEN
                    ALTER TYPE conceptomovimientocaja ADD VALUE IF NOT EXISTS 'DERECHOS_TRANSITO';
                    ALTER TYPE conceptomovimientocaja ADD VALUE IF NOT EXISTS 'EXAMENES_MEDICOS';
                END IF;
            END $$;
            """
        )

        conn.commit()
        print("✅ Migración aplicada: nuevas categorías de egreso disponibles.")

    except Exception as e:
        conn.rollback()
        print(f"❌ Error en migración: {e}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    run_migration()
