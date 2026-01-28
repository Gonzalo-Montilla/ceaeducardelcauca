"""
Migración para separar métodos de pago en columnas individuales
Fecha: 2026-01-28
"""

from sqlalchemy import create_engine, Column, Numeric
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def upgrade():
    """Agregar columnas separadas para cada método de pago"""
    with engine.connect() as conn:
        # Agregar columnas para transferencias
        conn.execute("""
            ALTER TABLE cajas 
            ADD COLUMN IF NOT EXISTS total_nequi NUMERIC(12, 2) DEFAULT 0 NOT NULL,
            ADD COLUMN IF NOT EXISTS total_daviplata NUMERIC(12, 2) DEFAULT 0 NOT NULL,
            ADD COLUMN IF NOT EXISTS total_transferencia_bancaria NUMERIC(12, 2) DEFAULT 0 NOT NULL;
        """)
        
        # Agregar columnas para tarjetas
        conn.execute("""
            ALTER TABLE cajas 
            ADD COLUMN IF NOT EXISTS total_tarjeta_debito NUMERIC(12, 2) DEFAULT 0 NOT NULL,
            ADD COLUMN IF NOT EXISTS total_tarjeta_credito NUMERIC(12, 2) DEFAULT 0 NOT NULL;
        """)
        
        conn.commit()
        print("✅ Columnas agregadas exitosamente")

def downgrade():
    """Revertir cambios"""
    with engine.connect() as conn:
        conn.execute("""
            ALTER TABLE cajas 
            DROP COLUMN IF EXISTS total_nequi,
            DROP COLUMN IF EXISTS total_daviplata,
            DROP COLUMN IF EXISTS total_transferencia_bancaria,
            DROP COLUMN IF EXISTS total_tarjeta_debito,
            DROP COLUMN IF EXISTS total_tarjeta_credito;
        """)
        
        conn.commit()
        print("✅ Columnas eliminadas exitosamente")

if __name__ == "__main__":
    print("Ejecutando migración: separar_metodos_pago")
    upgrade()
    print("Migración completada")
