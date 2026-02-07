"""
Migracion: set default y backfill de vehiculos.estado
"""
from sqlalchemy import text
from app.core.database import engine


def run():
    sql = """
    DO $$
    BEGIN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'vehiculos' AND column_name = 'estado'
        ) THEN
            -- Cambiar a VARCHAR para evitar conflictos con enum legacy
            EXECUTE 'ALTER TABLE vehiculos ALTER COLUMN estado TYPE VARCHAR(30) USING estado::text';
            EXECUTE 'UPDATE vehiculos SET estado = ''ACTIVO'' WHERE estado IS NULL';
            EXECUTE 'ALTER TABLE vehiculos ALTER COLUMN estado SET DEFAULT ''ACTIVO''';
        END IF;
    END $$;
    """

    with engine.begin() as conn:
        conn.execute(text(sql))

    print("Migracion vehiculos.estado default aplicada.")


if __name__ == "__main__":
    run()
