from sqlalchemy import text
from app.core.database import engine


def run():
    with engine.begin() as conn:
        conn.execute(text("""
            ALTER TABLE movimientos_caja
            ADD COLUMN IF NOT EXISTS tercero_nombre VARCHAR(255);
        """))
        conn.execute(text("""
            ALTER TABLE movimientos_caja
            ADD COLUMN IF NOT EXISTS tercero_documento VARCHAR(50);
        """))
        conn.execute(text("""
            ALTER TABLE movimientos_caja
            ADD COLUMN IF NOT EXISTS es_pago_mixto INTEGER DEFAULT 0;
        """))
        conn.execute(text("""
            ALTER TABLE movimientos_caja
            ALTER COLUMN metodo_pago DROP NOT NULL;
        """))
        conn.execute(text("""
            ALTER TABLE movimientos_caja
            ALTER COLUMN categoria TYPE VARCHAR(80)
            USING categoria::text;
        """))
        conn.execute(text("""
            ALTER TABLE movimientos_caja
            ALTER COLUMN categoria SET DEFAULT 'OTROS';
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS detalles_pago_movimiento_caja (
                id SERIAL PRIMARY KEY,
                movimiento_id INTEGER NOT NULL REFERENCES movimientos_caja(id) ON DELETE CASCADE,
                metodo_pago metodopago NOT NULL,
                monto NUMERIC(10, 2) NOT NULL,
                referencia VARCHAR(100),
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
            );
        """))

    print("Migracion add_movimientos_generales_caja aplicada.")


if __name__ == "__main__":
    run()
