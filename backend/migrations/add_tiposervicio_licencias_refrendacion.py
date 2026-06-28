"""
Migración: agregar nuevos tipos de servicio para licencias con refrendación.
"""
from sqlalchemy import text
from app.core.database import engine


def run():
    statements = [
        "ALTER TYPE tiposervicio ADD VALUE IF NOT EXISTS 'LICENCIA_A2_REFRENDACION';",
        "ALTER TYPE tiposervicio ADD VALUE IF NOT EXISTS 'LICENCIA_B1_REFRENDACION';",
        "ALTER TYPE tiposervicio ADD VALUE IF NOT EXISTS 'LICENCIA_C1_REFRENDACION';",
        """
        INSERT INTO tarifas (tipo_servicio, precio_base, costo_practica, activo)
        VALUES
            ('LICENCIA_A2_REFRENDACION', 950000, 0, TRUE),
            ('LICENCIA_B1_REFRENDACION', 1200000, 0, TRUE),
            ('LICENCIA_C1_REFRENDACION', 1300000, 0, TRUE)
        ON CONFLICT (tipo_servicio) DO NOTHING;
        """
    ]

    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))

    print("Migracion add_tiposervicio_licencias_refrendacion aplicada.")


if __name__ == "__main__":
    run()
