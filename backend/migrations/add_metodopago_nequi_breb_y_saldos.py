"""
Migración:
- Agrega nuevos métodos de pago al enum metodopago:
  NEQUI_ESCUELA, NEQUI_GERENCIA, BRE_B
- Agrega columnas de control en cajas:
  total_nequi_escuela, total_nequi_gerencia, total_bre_b
- Agrega columnas de control en caja_fuerte:
  saldo_nequi_escuela, saldo_nequi_gerencia, saldo_bre_b
"""
import os
import sys
from sqlalchemy import text

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.dirname(CURRENT_DIR)
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app.core.database import engine


def run():
    statements = [
        "ALTER TYPE metodopago ADD VALUE IF NOT EXISTS 'NEQUI_ESCUELA';",
        "ALTER TYPE metodopago ADD VALUE IF NOT EXISTS 'NEQUI_GERENCIA';",
        "ALTER TYPE metodopago ADD VALUE IF NOT EXISTS 'BRE_B';",
        """
        ALTER TABLE cajas
        ADD COLUMN IF NOT EXISTS total_nequi_escuela NUMERIC(12,2) NOT NULL DEFAULT 0;
        """,
        """
        ALTER TABLE cajas
        ADD COLUMN IF NOT EXISTS total_nequi_gerencia NUMERIC(12,2) NOT NULL DEFAULT 0;
        """,
        """
        ALTER TABLE cajas
        ADD COLUMN IF NOT EXISTS total_bre_b NUMERIC(12,2) NOT NULL DEFAULT 0;
        """,
        """
        ALTER TABLE caja_fuerte
        ADD COLUMN IF NOT EXISTS saldo_nequi_escuela NUMERIC(12,2) NOT NULL DEFAULT 0;
        """,
        """
        ALTER TABLE caja_fuerte
        ADD COLUMN IF NOT EXISTS saldo_nequi_gerencia NUMERIC(12,2) NOT NULL DEFAULT 0;
        """,
        """
        ALTER TABLE caja_fuerte
        ADD COLUMN IF NOT EXISTS saldo_bre_b NUMERIC(12,2) NOT NULL DEFAULT 0;
        """,
    ]

    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))

    print("Migracion add_metodopago_nequi_breb_y_saldos aplicada.")


if __name__ == "__main__":
    run()
