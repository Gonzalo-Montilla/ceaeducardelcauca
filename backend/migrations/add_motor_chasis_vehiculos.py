from sqlalchemy import text
from app.core.database import engine


def run_migration():
    with engine.connect() as conn:
        conn.execute(text("""
            ALTER TABLE vehiculos
            ADD COLUMN IF NOT EXISTS numero_motor VARCHAR(50);
        """))
        conn.execute(text("""
            ALTER TABLE vehiculos
            ADD COLUMN IF NOT EXISTS numero_chasis VARCHAR(50);
        """))
        conn.commit()


if __name__ == "__main__":
    run_migration()
    print("Migration add_motor_chasis_vehiculos completed.")
