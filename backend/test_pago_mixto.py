"""Script de prueba para pagos mixtos"""
from app.schemas.caja import PagoCreate, DetallePagoCreate
from app.models.pago import MetodoPago
from decimal import Decimal

print("=== Test Pagos Mixtos ===\n")

# Test 1: Pago simple
print("Test 1: Pago simple")
try:
    p = PagoCreate(
        estudiante_id=1,
        monto=Decimal('1000'),
        metodo_pago=MetodoPago.EFECTIVO,
        es_pago_mixto=False
    )
    print("✓ Pago simple creado correctamente\n")
except Exception as e:
    print(f"✗ Error: {e}\n")

# Test 2: Pago mixto válido
print("Test 2: Pago mixto válido (500 + 500 = 1000)")
try:
    pm = PagoCreate(
        estudiante_id=1,
        monto=Decimal('1000'),
        es_pago_mixto=True,
        detalles_pago=[
            DetallePagoCreate(metodo_pago=MetodoPago.EFECTIVO, monto=Decimal('500')),
            DetallePagoCreate(metodo_pago=MetodoPago.NEQUI, monto=Decimal('500'))
        ]
    )
    print("✓ Pago mixto creado correctamente\n")
except Exception as e:
    print(f"✗ Error: {e}\n")

# Test 3: Pago mixto con suma incorrecta
print("Test 3: Pago mixto inválido (600 + 500 ≠ 1000)")
try:
    pm = PagoCreate(
        estudiante_id=1,
        monto=Decimal('1000'),
        es_pago_mixto=True,
        detalles_pago=[
            DetallePagoCreate(metodo_pago=MetodoPago.EFECTIVO, monto=Decimal('600')),
            DetallePagoCreate(metodo_pago=MetodoPago.NEQUI, monto=Decimal('500'))
        ]
    )
    print("✗ ERROR: Debería haber fallado la validación\n")
except Exception as e:
    print(f"✓ Validación correcta: {e}\n")

# Test 4: Pago mixto con un solo método
print("Test 4: Pago mixto con un solo método")
try:
    pm = PagoCreate(
        estudiante_id=1,
        monto=Decimal('1000'),
        es_pago_mixto=True,
        detalles_pago=[
            DetallePagoCreate(metodo_pago=MetodoPago.EFECTIVO, monto=Decimal('1000'))
        ]
    )
    print("✗ ERROR: Debería haber fallado la validación\n")
except Exception as e:
    print(f"✓ Validación correcta: {e}\n")

# Test 5: Pago simple sin método
print("Test 5: Pago simple sin método de pago")
try:
    p = PagoCreate(
        estudiante_id=1,
        monto=Decimal('1000'),
        es_pago_mixto=False
    )
    print("✗ ERROR: Debería haber fallado la validación\n")
except Exception as e:
    print(f"✓ Validación correcta: {e}\n")

print("=== Tests completados ===")
