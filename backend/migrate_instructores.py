"""
Migración: Ampliar modelo de Instructor
Fecha: 2026-01-31
Descripción: Agregar campos adicionales al modelo Instructor
"""

from sqlalchemy import text
from app.core.database import engine

def migrate():
    """Ejecuta la migración"""
    with engine.connect() as conn:
        # Iniciar transacción
        trans = conn.begin()
        
        try:
            # Agregar columnas nuevas a la tabla instructores
            migrations = [
                # Foto del instructor
                "ALTER TABLE instructores ADD COLUMN foto_url TEXT",
                
                # Especialidad
                "ALTER TABLE instructores ADD COLUMN especialidad VARCHAR(200)",
                
                # Estado del instructor (crear tipo enum primero)
                "CREATE TYPE estadoinstructor AS ENUM ('ACTIVO', 'LICENCIA_MEDICA', 'VACACIONES', 'INACTIVO')",
                "ALTER TABLE instructores ADD COLUMN estado estadoinstructor NOT NULL DEFAULT 'ACTIVO'",
                
                # Fecha de contratación
                "ALTER TABLE instructores ADD COLUMN fecha_contratacion DATE",
                
                # Certificaciones
                "ALTER TABLE instructores ADD COLUMN certificaciones TEXT",
                
                # Tipo de contrato
                "ALTER TABLE instructores ADD COLUMN tipo_contrato VARCHAR(50)",
                
                # Calificación promedio
                "ALTER TABLE instructores ADD COLUMN calificacion_promedio NUMERIC(3, 2) DEFAULT 0.0",
                
                # Updated at
                "ALTER TABLE instructores ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
            ]
            
            for sql in migrations:
                print(f"Ejecutando: {sql}")
                try:
                    conn.execute(text(sql))
                except Exception as e:
                    # Si falla (por ejemplo, columna ya existe), continuar
                    print(f"  ⚠️  {str(e)}")
            
            # Confirmar transacción
            trans.commit()
            print("\n✅ Migración completada exitosamente")
            
        except Exception as e:
            trans.rollback()
            print(f"\n❌ Error en migración: {e}")
            raise

if __name__ == "__main__":
    migrate()
