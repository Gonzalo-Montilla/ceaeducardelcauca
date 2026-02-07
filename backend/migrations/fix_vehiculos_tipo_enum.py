"""
Migracion: cambia vehiculos.tipo de enum a varchar
"""
from sqlalchemy import text
from app.core.database import engine


def run():
    with engine.begin() as conn:
        conn.execute(text("""
            ALTER TABLE vehiculos
            ALTER COLUMN tipo TYPE VARCHAR(50)
            USING tipo::text;
        """))

    print("Migracion vehiculos.tipo a VARCHAR aplicada.")


if __name__ == "__main__":
    run()
