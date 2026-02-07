"""
Migración: agregar rol GERENTE al enum de usuarios
"""
from sqlalchemy import text
from app.core.database import engine


def run():
    statement = """
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            WHERE t.typname = 'rolusuario' AND e.enumlabel = 'GERENTE'
        ) THEN
            ALTER TYPE rolusuario ADD VALUE 'GERENTE';
        END IF;
    END
    $$;
    """

    with engine.begin() as conn:
        conn.execute(text(statement))

    print("Migracion de rol GERENTE aplicada.")


if __name__ == "__main__":
    run()
