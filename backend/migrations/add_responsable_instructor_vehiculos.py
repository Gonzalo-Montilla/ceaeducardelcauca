from sqlalchemy import text
from app.core.database import engine


def run_migration():
    with engine.connect() as conn:
        conn.execute(text("""
            ALTER TABLE vehiculos
            ADD COLUMN IF NOT EXISTS responsable_instructor_id INTEGER;
        """))
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'vehiculos_responsable_instructor_id_fkey'
                ) THEN
                    ALTER TABLE vehiculos
                    ADD CONSTRAINT vehiculos_responsable_instructor_id_fkey
                    FOREIGN KEY (responsable_instructor_id) REFERENCES instructores(id);
                END IF;
            END$$;
        """))
        conn.commit()


if __name__ == "__main__":
    run_migration()
    print("Migration add_responsable_instructor_vehiculos completed.")
