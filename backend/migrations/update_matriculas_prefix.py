from sqlalchemy import text
from app.core.database import engine


def run_migration():
    with engine.connect() as conn:
        conn.execute(text("""
            UPDATE estudiantes
            SET matricula_numero = REPLACE(matricula_numero, 'CEA-', 'CEAEDUCAR-')
            WHERE matricula_numero LIKE 'CEA-%';
        """))
        conn.commit()
    print("OK: matriculas updated to CEAEDUCAR- prefix.")


if __name__ == "__main__":
    run_migration()
