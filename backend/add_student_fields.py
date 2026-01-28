"""
Script para agregar nuevos campos a la tabla estudiantes
"""
from sqlalchemy import text
from app.core.database import engine

def add_new_fields():
    """Agregar nuevas columnas a la tabla estudiantes"""
    
    with engine.connect() as connection:
        # Agregar nuevos campos personales
        queries = [
            "ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS ocupacion VARCHAR(100)",
            "ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS estado_civil VARCHAR(20)",
            "ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS nivel_educativo VARCHAR(30)",
            "ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS estrato INTEGER",
            "ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS nivel_sisben VARCHAR(10)",
            "ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS necesidades_especiales TEXT",
            "ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS matricula_numero VARCHAR(50) UNIQUE",
            "ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS no_certificado VARCHAR(50)",
            
            # Modificar categoria para que sea opcional
            "ALTER TABLE estudiantes ALTER COLUMN categoria DROP NOT NULL",
            
            # Modificar tipo_servicio para que sea opcional
            "ALTER TABLE estudiantes ALTER COLUMN tipo_servicio DROP NOT NULL",
            
            # Modificar origen_cliente para que sea opcional
            "ALTER TABLE estudiantes ALTER COLUMN origen_cliente DROP NOT NULL",
            
            # Modificar valor_total_curso para que sea opcional
            "ALTER TABLE estudiantes ALTER COLUMN valor_total_curso DROP NOT NULL",
        ]
        
        for query in queries:
            try:
                connection.execute(text(query))
                connection.commit()
                print(f"✅ {query}")
            except Exception as e:
                print(f"⚠️  {query}")
                print(f"   Error: {str(e)}")
                connection.rollback()
    
    print("\n✅ Campos agregados exitosamente!")

if __name__ == "__main__":
    print("Agregando nuevos campos a la tabla estudiantes...\n")
    add_new_fields()
