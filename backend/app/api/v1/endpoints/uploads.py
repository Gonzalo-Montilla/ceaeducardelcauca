"""
Endpoint para manejo de uploads de archivos (fotos y documentos PDF)
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import Optional
import base64
import os
from pathlib import Path

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.usuario import Usuario

router = APIRouter()

# Directorio para almacenar archivos (en producción usar S3, Cloud Storage, etc.)
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Subdirectorios
PHOTOS_DIR = UPLOAD_DIR / "photos"
DOCUMENTS_DIR = UPLOAD_DIR / "documents"
PHOTOS_DIR.mkdir(exist_ok=True)
DOCUMENTS_DIR.mkdir(exist_ok=True)


@router.post("/instructor/foto")
async def upload_instructor_foto(
    foto_base64: str,
    instructor_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Subir foto de instructor en base64
    Retorna la URL donde se guardó la foto
    """
    try:
        # Validar que sea base64 válido
        if not foto_base64.startswith('data:image'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato de imagen inválido"
            )
        
        # Por ahora, simplemente retornamos el base64 para guardarlo en la BD
        # En producción, aquí subirías a S3/CloudStorage y retornarías la URL
        return {
            "foto_url": foto_base64,
            "message": "Foto procesada correctamente"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar foto: {str(e)}"
        )


@router.post("/instructor/documento")
async def upload_instructor_documento(
    archivo: UploadFile = File(...),
    tipo_documento: str = "general",  # cedula, licencia, certificado
    instructor_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Subir documento PDF del instructor
    tipo_documento puede ser: cedula, licencia, certificado
    """
    try:
        # Validar que sea PDF
        if not archivo.filename.endswith('.pdf'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se permiten archivos PDF"
            )
        
        # Leer el archivo y convertir a base64
        contenido = await archivo.read()
        pdf_base64 = base64.b64encode(contenido).decode('utf-8')
        
        # Crear data URI para PDF
        pdf_data_uri = f"data:application/pdf;base64,{pdf_base64}"
        
        return {
            "documento_url": pdf_data_uri,
            "tipo_documento": tipo_documento,
            "nombre_archivo": archivo.filename,
            "message": "Documento procesado correctamente"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar documento: {str(e)}"
        )
