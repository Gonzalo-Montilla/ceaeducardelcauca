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

    # Email (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_NAME: str = "CEA EDUCAR"
    SMTP_USE_TLS: bool = True

    # Habeas Data
    HABEAS_RAZON_SOCIAL: str = "ESCUELA DE AUTOMOVILISMO EDUCAR DEL CAUCA SAS"
    HABEAS_NIT: str = "901463869-8"
    HABEAS_CONTACTO: str = "+57 314 3005442"
    HABEAS_CORREO: str = "ceaeducardelcaucasas@gmail.com"
    HABEAS_POLITICA_URL: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
