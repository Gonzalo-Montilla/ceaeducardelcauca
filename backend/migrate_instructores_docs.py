"""
Migración para agregar campos de documentación y vigencias al modelo Instructor
"""
from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate():
    """Ejecutar migración"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        print("Agregando columnas de vigencias y documentación a instructores...")
        
        try:
            # Vigencias de licencia
            conn.execute(text("""
                ALTER TABLE instructores 
                ADD COLUMN licencia_vigencia_desde DATE
            """))
            print("✓ Columna licencia_vigencia_desde agregada")
        except Exception as e:
            print(f"  licencia_vigencia_desde ya existe o error: {e}")
        
        try:
            conn.execute(text("""
                ALTER TABLE instructores 
                ADD COLUMN licencia_vigencia_hasta DATE
            """))
            print("✓ Columna licencia_vigencia_hasta agregada")
        except Exception as e:
            print(f"  licencia_vigencia_hasta ya existe o error: {e}")
        
        try:
            # Vigencias de certificado
            conn.execute(text("""
                ALTER TABLE instructores 
                ADD COLUMN certificado_vigencia_desde DATE
            """))
            print("✓ Columna certificado_vigencia_desde agregada")
        except Exception as e:
            print(f"  certificado_vigencia_desde ya existe o error: {e}")
        
        try:
            conn.execute(text("""
                ALTER TABLE instructores 
                ADD COLUMN certificado_vigencia_hasta DATE
            """))
            print("✓ Columna certificado_vigencia_hasta agregada")
        except Exception as e:
            print(f"  certificado_vigencia_hasta ya existe o error: {e}")
        
        try:
            # Examen médico
            conn.execute(text("""
                ALTER TABLE instructores 
                ADD COLUMN examen_medico_fecha DATE
            """))
            print("✓ Columna examen_medico_fecha agregada")
        except Exception as e:
            print(f"  examen_medico_fecha ya existe o error: {e}")
        
        try:
            # URLs de documentos PDF
            conn.execute(text("""
                ALTER TABLE instructores 
                ADD COLUMN cedula_pdf_url TEXT
            """))
            print("✓ Columna cedula_pdf_url agregada")
        except Exception as e:
            print(f"  cedula_pdf_url ya existe o error: {e}")
        
        try:
            conn.execute(text("""
                ALTER TABLE instructores 
                ADD COLUMN licencia_pdf_url TEXT
            """))
            print("✓ Columna licencia_pdf_url agregada")
        except Exception as e:
            print(f"  licencia_pdf_url ya existe o error: {e}")
        
        try:
            conn.execute(text("""
                ALTER TABLE instructores 
                ADD COLUMN certificado_pdf_url TEXT
            """))
            print("✓ Columna certificado_pdf_url agregada")
        except Exception as e:
            print(f"  certificado_pdf_url ya existe o error: {e}")
        
        try:
            # Número RUNT
            conn.execute(text("""
                ALTER TABLE instructores 
                ADD COLUMN numero_runt VARCHAR(50)
            """))
            print("✓ Columna numero_runt agregada")
        except Exception as e:
            print(f"  numero_runt ya existe o error: {e}")
        
        try:
            # Estado de documentación (enum)
            conn.execute(text("""
                ALTER TABLE instructores 
                ADD COLUMN estado_documentacion VARCHAR(20) DEFAULT 'INCOMPLETO'
            """))
            print("✓ Columna estado_documentacion agregada")
        except Exception as e:
            print(f"  estado_documentacion ya existe o error: {e}")
        
        conn.commit()
        print("\n✅ Migración completada exitosamente")

if __name__ == "__main__":
    migrate()
