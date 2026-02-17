"""
Migración: crear tabla de tarifas y seed inicial
"""
from sqlalchemy import text
from app.core.database import engine


def run():
    statements = [
        """
        CREATE TABLE IF NOT EXISTS tarifas (
            id SERIAL PRIMARY KEY,
            tipo_servicio VARCHAR(50) UNIQUE NOT NULL,
            precio_base NUMERIC(10,2) NOT NULL,
            costo_practica NUMERIC(10,2) NOT NULL DEFAULT 0,
            activo BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP
        );
        """,
        """
        INSERT INTO tarifas (tipo_servicio, precio_base, costo_practica, activo)
        VALUES
            ('LICENCIA_A2', 950000, 0, TRUE),
            ('LICENCIA_B1', 1200000, 0, TRUE),
            ('LICENCIA_C1', 1300000, 0, TRUE),
            ('RECATEGORIZACION_C1', 1300000, 0, TRUE),
            ('COMBO_A2_B1', 2000000, 0, TRUE),
            ('COMBO_A2_C1', 2200000, 0, TRUE),
            ('CERTIFICADO_MOTO', 480000, 0, TRUE),
            ('CERTIFICADO_B1', 600000, 100000, TRUE),
            ('CERTIFICADO_C1', 750000, 100000, TRUE),
            ('CERTIFICADO_B1_SIN_PRACTICA', 600000, 0, TRUE),
            ('CERTIFICADO_C1_SIN_PRACTICA', 750000, 0, TRUE)
        ON CONFLICT (tipo_servicio) DO NOTHING;
        """
    ]

    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))

    print("Migracion de tarifas aplicada.")


if __name__ == "__main__":
    run()
