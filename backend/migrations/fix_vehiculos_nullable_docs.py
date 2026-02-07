"""
Migracion: permite NULL en campos de documentos de vehiculos
"""
from sqlalchemy import text
from app.core.database import engine


def run():
    sql = """
    DO $$
    BEGIN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'vehiculos' AND column_name = 'soat_vencimiento'
        ) THEN
            EXECUTE 'ALTER TABLE vehiculos ALTER COLUMN soat_vencimiento DROP NOT NULL';
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'vehiculos' AND column_name = 'rtm_vencimiento'
        ) THEN
            EXECUTE 'ALTER TABLE vehiculos ALTER COLUMN rtm_vencimiento DROP NOT NULL';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'vehiculos' AND column_name = 'tecnomecanica_vencimiento'
        ) THEN
            EXECUTE 'ALTER TABLE vehiculos ALTER COLUMN tecnomecanica_vencimiento DROP NOT NULL';
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'vehiculos' AND column_name = 'soat_url'
        ) THEN
            EXECUTE 'ALTER TABLE vehiculos ALTER COLUMN soat_url DROP NOT NULL';
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'vehiculos' AND column_name = 'rtm_url'
        ) THEN
            EXECUTE 'ALTER TABLE vehiculos ALTER COLUMN rtm_url DROP NOT NULL';
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'vehiculos' AND column_name = 'seguro_vencimiento'
        ) THEN
            EXECUTE 'ALTER TABLE vehiculos ALTER COLUMN seguro_vencimiento DROP NOT NULL';
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'vehiculos' AND column_name = 'seguro_url'
        ) THEN
            EXECUTE 'ALTER TABLE vehiculos ALTER COLUMN seguro_url DROP NOT NULL';
        END IF;
    END $$;
    """

    with engine.begin() as conn:
        conn.execute(text(sql))

    print("Migracion vehiculos documentos NULL aplicada.")


if __name__ == "__main__":
    run()
