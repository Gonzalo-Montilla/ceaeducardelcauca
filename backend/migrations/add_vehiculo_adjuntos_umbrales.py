"""
Migración: adjuntos y umbrales de consumo de vehículos
- Crea tablas de adjuntos para mantenimientos y combustibles
- Crea tabla de umbrales de consumo por tipo de vehículo
"""
from sqlalchemy import text
from app.core.database import engine


def run():
    statements = [
        """
        CREATE TABLE IF NOT EXISTS vehiculo_mantenimiento_adjuntos (
            id SERIAL PRIMARY KEY,
            mantenimiento_id INTEGER NOT NULL REFERENCES vehiculo_mantenimientos(id),
            archivo_url TEXT NOT NULL,
            nombre_archivo VARCHAR(200),
            mime VARCHAR(100),
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS vehiculo_combustible_adjuntos (
            id SERIAL PRIMARY KEY,
            combustible_id INTEGER NOT NULL REFERENCES vehiculo_combustibles(id),
            archivo_url TEXT NOT NULL,
            nombre_archivo VARCHAR(200),
            mime VARCHAR(100),
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS vehiculo_consumo_umbrales (
            id SERIAL PRIMARY KEY,
            tipo VARCHAR(50) UNIQUE NOT NULL,
            km_por_galon_min NUMERIC(10,2) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        """
    ]

    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))

    print("Migracion de adjuntos y umbrales de vehiculos aplicada.")


if __name__ == "__main__":
    run()
