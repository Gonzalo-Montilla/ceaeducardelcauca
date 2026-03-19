from sqlalchemy import text
from app.core.database import engine


def run():
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE pagos ADD COLUMN IF NOT EXISTS factura_xml_url VARCHAR(500);"))
        conn.execute(text("ALTER TABLE pagos ADD COLUMN IF NOT EXISTS factura_cufe VARCHAR(100);"))
        conn.execute(text("ALTER TABLE pagos ADD COLUMN IF NOT EXISTS factura_estado VARCHAR(50);"))
        conn.execute(text("ALTER TABLE pagos ADD COLUMN IF NOT EXISTS factura_error TEXT;"))
    print("Migracion add_factus_factura_fields_pagos aplicada.")


if __name__ == "__main__":
    run()
