from sqlalchemy import text
from app.core.database import engine


def run_migration():
    with engine.connect() as conn:
        conn.execute(text("""
            ALTER TABLE movimientos_caja_fuerte
            ADD COLUMN IF NOT EXISTS inventario_detalle TEXT;
        """))
        conn.commit()


if __name__ == "__main__":
    run_migration()
    print("Migration add_inventario_detalle_movimientos_caja_fuerte completed.")
