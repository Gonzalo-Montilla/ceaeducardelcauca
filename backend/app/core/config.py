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
    BACKEND_CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

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

    # Factus (Facturación electrónica)
    FACTUS_ENABLED: bool = False
    FACTUS_BASE_URL: str = "https://api-sandbox.factus.com.co"
    FACTUS_USERNAME: Optional[str] = None
    FACTUS_PASSWORD: Optional[str] = None
    FACTUS_CLIENT_ID: Optional[str] = None
    FACTUS_CLIENT_SECRET: Optional[str] = None
    FACTUS_GRANT_TYPE: str = "password"
    FACTUS_SCOPE: Optional[str] = None
    FACTUS_TIMEOUT_SECONDS: int = 30
    FACTUS_NUMBERING_RANGE_ID: Optional[int] = None
    FACTUS_DOCUMENT_CODE: str = "01"
    FACTUS_PAYMENT_METHOD_CODE: str = "10"
    FACTUS_ESTABLISHMENT_NAME: Optional[str] = None
    FACTUS_ESTABLISHMENT_ADDRESS: Optional[str] = None
    FACTUS_ESTABLISHMENT_PHONE: Optional[str] = None
    FACTUS_ESTABLISHMENT_EMAIL: Optional[str] = None
    FACTUS_ESTABLISHMENT_MUNICIPALITY_ID: Optional[int] = None
    FACTUS_CUSTOMER_LEGAL_ORG_ID: str = "2"
    FACTUS_CUSTOMER_TRIBUTE_ID: str = "21"
    FACTUS_CUSTOMER_IDENTIFICATION_DOCUMENT_ID: int = 3
    FACTUS_CUSTOMER_MUNICIPALITY_ID: Optional[int] = None
    FACTUS_ITEM_UNIT_MEASURE_ID: int = 70
    FACTUS_ITEM_STANDARD_CODE_ID: int = 1
    FACTUS_ITEM_TRIBUTE_ID: int = 1
    FACTUS_ITEM_TAX_RATE: str = "0.00"
    FACTUS_ITEM_IS_EXCLUDED: int = 0
    FACTUS_ITEM_DISCOUNT_RATE: int = 0
    FACTUS_ITEM_CODE_REFERENCE: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
