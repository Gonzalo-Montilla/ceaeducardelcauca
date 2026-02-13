import requests
import json

# Token de acceso (debes obtenerlo del login)
# Por ahora solo verificamos qué está pasando

# Datos de prueba con foto base64 pequeña
data = {
    "email": "test@example.com",
    "password": "12345678",
    "primer_nombre": "TEST",
    "segundo_nombre": "USUARIO",
    "primer_apellido": "EJEMPLO",
    "segundo_apellido": "PRUEBA",
    "cedula": "12345678",
    "telefono": "3001234567",
    "fecha_nacimiento": "1990-01-01",
    "direccion": "CALLE 123",
    "ciudad": "POPAYAN",
    "barrio": "CENTRO",
    "tipo_sangre": "O+",
    "eps": "NUEVA EPS",
    "ocupacion": "EMPLEADO",
    "estado_civil": "SOLTERO",
    "nivel_educativo": "BACHILLER",
    "estrato": 3,
    "nivel_sisben": "B1",
    "necesidades_especiales": None,
    "contacto_emergencia_nombre": "MARIA LOPEZ",
    "contacto_emergencia_telefono": "3009876543",
    "foto_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaWmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q=="
}

print("Longitud de foto_base64:", len(data["foto_base64"]))
print("Primeros 50 caracteres:", data["foto_base64"][:50])

# Verificar que JSON se serializa correctamente
try:
    json_data = json.dumps(data)
    print("\nJSON serializado correctamente")
    print("Longitud del JSON:", len(json_data))
except Exception as e:
    print(f"\nError al serializar JSON: {e}")
