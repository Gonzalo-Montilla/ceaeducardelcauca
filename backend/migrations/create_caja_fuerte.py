from sqlalchemy import text
from app.core.database import engine


def run_migration():
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS caja_fuerte (
                id SERIAL PRIMARY KEY,
                saldo_efectivo NUMERIC(12,2) NOT NULL DEFAULT 0,
                saldo_nequi NUMERIC(12,2) NOT NULL DEFAULT 0,
                saldo_daviplata NUMERIC(12,2) NOT NULL DEFAULT 0,
                saldo_transferencia_bancaria NUMERIC(12,2) NOT NULL DEFAULT 0,
                saldo_tarjeta_debito NUMERIC(12,2) NOT NULL DEFAULT 0,
                saldo_tarjeta_credito NUMERIC(12,2) NOT NULL DEFAULT 0,
                saldo_credismart NUMERIC(12,2) NOT NULL DEFAULT 0,
                saldo_sistecredito NUMERIC(12,2) NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS movimientos_caja_fuerte (
                id SERIAL PRIMARY KEY,
                caja_fuerte_id INTEGER NOT NULL REFERENCES caja_fuerte(id),
                caja_id INTEGER REFERENCES cajas(id),
                tipo VARCHAR(20) NOT NULL,
                metodo_pago VARCHAR(50) NOT NULL,
                concepto VARCHAR(255) NOT NULL,
                categoria VARCHAR(80),
                monto NUMERIC(12,2) NOT NULL,
                fecha TIMESTAMP NOT NULL DEFAULT NOW(),
                observaciones TEXT,
                inventario_detalle TEXT,
                usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS inventario_efectivo (
                id SERIAL PRIMARY KEY,
                caja_fuerte_id INTEGER NOT NULL REFERENCES caja_fuerte(id),
                denominacion INTEGER NOT NULL,
                cantidad INTEGER NOT NULL DEFAULT 0,
                total NUMERIC(12,2) NOT NULL DEFAULT 0,
                updated_at TIMESTAMP
            );
        """))

        conn.commit()


if __name__ == "__main__":
    run_migration()
    print("Migration create_caja_fuerte completed.")
