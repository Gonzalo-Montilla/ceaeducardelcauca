from sqlalchemy import text
from app.core.database import engine


def run_migration():
    with engine.connect() as conn:
        conn.execute(text("""
            UPDATE estudiantes
            SET horas_teoricas_requeridas = 28,
                horas_practicas_requeridas = 15,
                horas_teoricas_completadas = LEAST(horas_teoricas_completadas, 28),
                horas_practicas_completadas = LEAST(horas_practicas_completadas, 15)
            WHERE categoria = 'A2';
        """))
        conn.execute(text("""
            UPDATE estudiantes
            SET horas_teoricas_requeridas = 30,
                horas_practicas_requeridas = 20,
                horas_teoricas_completadas = LEAST(horas_teoricas_completadas, 30),
                horas_practicas_completadas = LEAST(horas_practicas_completadas, 20)
            WHERE categoria = 'B1';
        """))
        conn.execute(text("""
            UPDATE estudiantes
            SET horas_teoricas_requeridas = 36,
                horas_practicas_requeridas = 30,
                horas_teoricas_completadas = LEAST(horas_teoricas_completadas, 36),
                horas_practicas_completadas = LEAST(horas_practicas_completadas, 30)
            WHERE categoria = 'C1';
        """))
        conn.commit()
    print("OK: horas requeridas actualizadas para A2, B1 y C1.")


if __name__ == "__main__":
    run_migration()
