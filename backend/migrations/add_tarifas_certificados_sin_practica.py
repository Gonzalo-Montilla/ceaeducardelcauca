"""
Migración: crear tarifas de certificados sin práctica
"""
from sqlalchemy import text
from app.core.database import engine


def run():
    stmt = """
    INSERT INTO tarifas (tipo_servicio, precio_base, costo_practica, activo)
    VALUES
        ('CERTIFICADO_B1_SIN_PRACTICA', 600000, 0, TRUE),
        ('CERTIFICADO_C1_SIN_PRACTICA', 750000, 0, TRUE)
    ON CONFLICT (tipo_servicio) DO UPDATE SET
        precio_base = EXCLUDED.precio_base,
        costo_practica = EXCLUDED.costo_practica,
        activo = TRUE,
        updated_at = NOW();
    """

    with engine.begin() as conn:
        conn.execute(text(stmt))

    print("Migracion de tarifas sin practica aplicada.")


if __name__ == "__main__":
    run()
