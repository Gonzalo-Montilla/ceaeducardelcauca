"""
Migración: actualizar tarifas de certificados sin práctica
"""
from sqlalchemy import text
from app.core.database import engine


def run():
    statements = [
        """
        INSERT INTO tarifas (tipo_servicio, precio_base, costo_practica, activo)
        VALUES
            ('CERTIFICADO_B1', 600000, 100000, TRUE),
            ('CERTIFICADO_C1', 750000, 100000, TRUE)
        ON CONFLICT (tipo_servicio) DO UPDATE SET
            precio_base = EXCLUDED.precio_base,
            costo_practica = EXCLUDED.costo_practica,
            activo = TRUE,
            updated_at = NOW();
        """
    ]

    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))

    print("Migracion de tarifas de certificados aplicada.")


if __name__ == "__main__":
    run()
