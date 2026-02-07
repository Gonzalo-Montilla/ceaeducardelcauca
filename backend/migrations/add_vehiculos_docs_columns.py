from sqlalchemy import text
from app.core.database import engine


def run_migration():
    with engine.connect() as conn:
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'vehiculos' AND column_name = 'soat_vencimiento'
                ) THEN
                    EXECUTE 'ALTER TABLE vehiculos ADD COLUMN soat_vencimiento DATE';
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'vehiculos' AND column_name = 'rtm_vencimiento'
                ) THEN
                    EXECUTE 'ALTER TABLE vehiculos ADD COLUMN rtm_vencimiento DATE';
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'vehiculos' AND column_name = 'tecnomecanica_vencimiento'
                ) THEN
                    EXECUTE 'ALTER TABLE vehiculos ADD COLUMN tecnomecanica_vencimiento DATE';
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'vehiculos' AND column_name = 'seguro_vencimiento'
                ) THEN
                    EXECUTE 'ALTER TABLE vehiculos ADD COLUMN seguro_vencimiento DATE';
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'vehiculos' AND column_name = 'soat_url'
                ) THEN
                    EXECUTE 'ALTER TABLE vehiculos ADD COLUMN soat_url TEXT';
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'vehiculos' AND column_name = 'rtm_url'
                ) THEN
                    EXECUTE 'ALTER TABLE vehiculos ADD COLUMN rtm_url TEXT';
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'vehiculos' AND column_name = 'seguro_url'
                ) THEN
                    EXECUTE 'ALTER TABLE vehiculos ADD COLUMN seguro_url TEXT';
                END IF;
            END $$;
        """))
        conn.commit()
    print("OK: vehiculos docs columns added.")


if __name__ == "__main__":
    run_migration()
