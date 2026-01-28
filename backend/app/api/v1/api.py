from fastapi import APIRouter
from app.api.v1.endpoints import auth, estudiantes

api_router = APIRouter()

# Incluir routers de endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
api_router.include_router(estudiantes.router, prefix="/estudiantes", tags=["Estudiantes"])

# Aquí se agregarán más routers cuando se creen los módulos
# api_router.include_router(registro.router, prefix="/registro", tags=["Registro"])
# api_router.include_router(clases.router, prefix="/clases", tags=["Clases"])
# api_router.include_router(vehiculos.router, prefix="/vehiculos", tags=["Vehículos"])
