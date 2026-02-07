"""
Migración: hoja de vida de vehículos
- Agrega columnas nuevas a vehiculos
- Crea tablas de mantenimientos, repuestos y combustible
"""
from sqlalchemy import text
from app.core.database import engine


def run():
    statements = [
        # Nuevas columnas en vehiculos
        """
        ALTER TABLE vehiculos
        ADD COLUMN IF NOT EXISTS is_active INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS color VARCHAR(30),
        ADD COLUMN IF NOT EXISTS cilindraje VARCHAR(30),
        ADD COLUMN IF NOT EXISTS vin VARCHAR(50),
        ADD COLUMN IF NOT EXISTS foto_url TEXT,
        ADD COLUMN IF NOT EXISTS kilometraje_actual INTEGER;
        """,
        # Tabla mantenimientos
        """
        CREATE TABLE IF NOT EXISTS vehiculo_mantenimientos (
            id SERIAL PRIMARY KEY,
            vehiculo_id INTEGER NOT NULL REFERENCES vehiculos(id),
            fecha TIMESTAMP NOT NULL DEFAULT NOW(),
            tipo VARCHAR(30) DEFAULT 'FALLA',
            descripcion_falla TEXT,
            diagnostico TEXT,
            reparacion_requerida TEXT,
            estado VARCHAR(30) DEFAULT 'ABIERTO',
            km_registro INTEGER,
            costo_total NUMERIC(12,2) DEFAULT 0,
            taller VARCHAR(100),
            observaciones TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        """,
        # Tabla repuestos
        """
        CREATE TABLE IF NOT EXISTS vehiculo_repuestos (
            id SERIAL PRIMARY KEY,
            mantenimiento_id INTEGER NOT NULL REFERENCES vehiculo_mantenimientos(id),
            nombre VARCHAR(100) NOT NULL,
            cantidad INTEGER DEFAULT 1,
            costo_unitario NUMERIC(12,2) DEFAULT 0,
            proveedor VARCHAR(100),
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        """,
        # Tabla combustible
        """
        CREATE TABLE IF NOT EXISTS vehiculo_combustibles (
            id SERIAL PRIMARY KEY,
            vehiculo_id INTEGER NOT NULL REFERENCES vehiculos(id),
            fecha TIMESTAMP NOT NULL DEFAULT NOW(),
            km_inicial INTEGER NOT NULL,
            km_final INTEGER,
            nivel_inicial VARCHAR(20),
            nivel_final VARCHAR(20),
            litros NUMERIC(10,2),
            costo NUMERIC(12,2),
            recibo_url TEXT,
            conductor VARCHAR(100),
            observaciones TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        """
    ]

    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))

    print("Migracion de hoja de vida de vehiculos aplicada.")


if __name__ == "__main__":
    run()
