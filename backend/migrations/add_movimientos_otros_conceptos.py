from sqlalchemy import text
from app.core.database import engine


def run_migration():
    with engine.connect() as conn:
        conn.execute(text("""
            ALTER TABLE movimientos_caja
            ADD COLUMN IF NOT EXISTS tercero_nombre VARCHAR(255),
            ADD COLUMN IF NOT EXISTS tercero_documento VARCHAR(50),
            ADD COLUMN IF NOT EXISTS es_pago_mixto INTEGER DEFAULT 0,
            ALTER COLUMN metodo_pago DROP NOT NULL;
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS detalles_pago_movimiento_caja (
                id SERIAL PRIMARY KEY,
                movimiento_id INTEGER NOT NULL REFERENCES movimientos_caja(id) ON DELETE CASCADE,
                metodo_pago metodopago NOT NULL,
                monto NUMERIC(10, 2) NOT NULL,
                referencia VARCHAR(100),
                created_at TIMESTAMP DEFAULT NOW() NOT NULL
            );
        """))

        conn.execute(text("""
            ALTER TYPE conceptoegreso ADD VALUE IF NOT EXISTS 'ESTUDIANTE_NO_REGISTRADO';
        """))
        conn.execute(text("""
            ALTER TYPE conceptoegreso ADD VALUE IF NOT EXISTS 'PAGO_PRESTAMO_EMPLEADO';
        """))
        conn.execute(text("""
            ALTER TYPE conceptoegreso ADD VALUE IF NOT EXISTS 'VENTA_MATERIAL';
        """))
        conn.execute(text("""
            ALTER TYPE conceptoegreso ADD VALUE IF NOT EXISTS 'INGRESO_ADMINISTRATIVO';
        """))
        conn.execute(text("""
            ALTER TYPE conceptoegreso ADD VALUE IF NOT EXISTS 'EGRESO_ADMINISTRATIVO';
        """))

        conn.commit()


if __name__ == "__main__":
    run_migration()
    print("Migración add_movimientos_otros_conceptos aplicada.")
