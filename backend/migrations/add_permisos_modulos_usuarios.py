from sqlalchemy import text
from app.core.database import engine


def run_migration():
    with engine.connect() as conn:
        conn.execute(text("""
            ALTER TABLE usuarios
            ADD COLUMN IF NOT EXISTS permisos_modulos JSON;
        """))
        conn.commit()


if __name__ == "__main__":
    run_migration()
    print("Migration add_permisos_modulos_usuarios completed.")
