from sqlalchemy import text
from app.core.database import engine


def run_migration():
    with engine.connect() as conn:
        conn.execute(text("""
            ALTER TABLE usuarios
            ADD COLUMN IF NOT EXISTS tipo_documento VARCHAR(30) DEFAULT 'CEDULA';
        """))
        conn.execute(text("""
            UPDATE usuarios
            SET tipo_documento = 'CEDULA'
            WHERE tipo_documento IS NULL;
        """))
        conn.commit()


if __name__ == "__main__":
    run_migration()
    print("Migration add_tipo_documento_usuarios completed.")
