"""
Migración: Hacer campos opcionales hasta que se defina el servicio
"""
from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Hacer nullable los campos que se definen al asignar servicio
        print("Haciendo campos opcionales...")
        
        conn.execute(text("""
            ALTER TABLE estudiantes 
            ALTER COLUMN origen_cliente DROP NOT NULL;
        """))
        conn.commit()
        
        conn.execute(text("""
            ALTER TABLE estudiantes 
            ALTER COLUMN tipo_servicio DROP NOT NULL;
        """))
        conn.commit()
        
        conn.execute(text("""
            ALTER TABLE estudiantes 
            ALTER COLUMN valor_total_curso DROP NOT NULL;
        """))
        conn.commit()
        
        print("✅ Migración completada exitosamente")

if __name__ == "__main__":
    migrate()
