"""
Migración: Cambiar campo foto_url de String(500) a Text para soportar base64
"""
from sqlalchemy import create_engine, text
from app.core.config import settings

def upgrade():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.begin() as conn:
        # PostgreSQL
        if 'postgresql' in settings.DATABASE_URL:
            conn.execute(text("""
                ALTER TABLE estudiantes 
                ALTER COLUMN foto_url TYPE TEXT;
            """))
            
            conn.execute(text("""
                ALTER TABLE estudiantes 
                ALTER COLUMN cedula_frontal_url TYPE TEXT;
            """))
            
            conn.execute(text("""
                ALTER TABLE estudiantes 
                ALTER COLUMN cedula_posterior_url TYPE TEXT;
            """))
            
            conn.execute(text("""
                ALTER TABLE estudiantes 
                ALTER COLUMN examen_medico_url TYPE TEXT;
            """))
            
            conn.execute(text("""
                ALTER TABLE estudiantes 
                ALTER COLUMN contrato_pdf_url TYPE TEXT;
            """))
        
        print("✅ Migración completada: campos de URL cambiados a TEXT")

if __name__ == "__main__":
    upgrade()
