from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """
    Configuración de la aplicación desde variables de entorno
    """
    # Aplicación
    PROJECT_NAME: str = "CEA EDUCAR API"
    API_V1_STR: str = "/api/v1"
    
    # Base de datos PostgreSQL
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/cea_educar"
    
    # Seguridad JWT
    SECRET_KEY: str = "cea-educar-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 días
    
    # CORS
    BACKEND_CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
