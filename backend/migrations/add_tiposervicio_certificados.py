from sqlalchemy import text
from app.core.database import engine


def run():
    with engine.begin() as conn:
        conn.execute(text("ALTER TYPE tiposervicio ADD VALUE IF NOT EXISTS 'CERTIFICADO_B1_SIN_PRACTICA';"))
        conn.execute(text("ALTER TYPE tiposervicio ADD VALUE IF NOT EXISTS 'CERTIFICADO_C1_SIN_PRACTICA';"))
        conn.execute(text("ALTER TYPE tiposervicio ADD VALUE IF NOT EXISTS 'CERTIFICADO_A2_B1_SIN_PRACTICA';"))
        conn.execute(text("ALTER TYPE tiposervicio ADD VALUE IF NOT EXISTS 'CERTIFICADO_A2_C1_SIN_PRACTICA';"))
        conn.execute(text("ALTER TYPE tiposervicio ADD VALUE IF NOT EXISTS 'CERTIFICADO_A2_B1_CON_PRACTICA';"))
        conn.execute(text("ALTER TYPE tiposervicio ADD VALUE IF NOT EXISTS 'CERTIFICADO_A2_C1_CON_PRACTICA';"))

    print("Migracion add_tiposervicio_certificados aplicada.")


if __name__ == "__main__":
    run()
