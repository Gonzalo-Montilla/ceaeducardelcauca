"""
Migración: crear tarifas de certificados A2+B1 y A2+C1 (con/sin práctica)
"""
from sqlalchemy import text
from app.core.database import engine


def run():
    stmt = """
    INSERT INTO tarifas (tipo_servicio, precio_base, costo_practica, activo)
    VALUES
        ('CERTIFICADO_A2_B1_SIN_PRACTICA', 1080000, 0, TRUE),
        ('CERTIFICADO_A2_C1_SIN_PRACTICA', 1230000, 0, TRUE),
        ('CERTIFICADO_A2_B1_CON_PRACTICA', 1180000, 0, TRUE),
        ('CERTIFICADO_A2_C1_CON_PRACTICA', 1330000, 0, TRUE)
    ON CONFLICT (tipo_servicio) DO UPDATE SET
        precio_base = EXCLUDED.precio_base,
        costo_practica = EXCLUDED.costo_practica,
        activo = TRUE,
        updated_at = NOW();
    """

    with engine.begin() as conn:
        conn.execute(text(stmt))

    print("Migracion de tarifas de certificados combo aplicada.")


if __name__ == "__main__":
    run()
